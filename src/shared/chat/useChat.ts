import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isDev, supabaseAnonKey, supabaseUrl } from '@/lib/env';
import { MODULES } from '@/home/moduleRegistry';
import type { WeakSpot } from '@/shared/assessment/weakness';
import { loadCorpus, type Chunk } from './corpus';
import { buildIndex, retrieve, type RetrievalIndex } from './retrieve';
import { corpusAnswer, type CorpusCitation } from './corpusAnswer';
import { excerptsFrom, moduleCatalogue, renderWeakness, type ChatRequest } from './systemPrompt';

/**
 * Talking to the tutor.
 *
 * The context is assembled here rather than on the server because everything it is made of is
 * already on the client: the corpus, the progress store, the route. The function's job is the
 * three things a browser cannot be trusted with — the key, the access gate and the spend cap.
 *
 * Streamed, because a grounded answer takes several seconds to generate and a silent spinner for
 * that long reads as broken.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  /**
   * Set when the words are the app's own writing rather than a generated answer.
   *
   * Provenance, not decoration: rendering an authored passage identically to a synthesised one
   * would misrepresent where it came from, so `ChatPanel` labels and attributes it.
   */
  source?: 'corpus';
  citations?: CorpusCitation[];
}

export type ChatStatus = 'idle' | 'thinking' | 'streaming';

/** How many excerpts a question earns. Six is about 1,500 words — enough to ground an answer
 * without paying to send the whole module. */
const EXCERPT_LIMIT = 6;

/** Built once per session and shared; the corpus never changes at runtime. */
let indexPromise: Promise<RetrievalIndex> | null = null;
function retrievalIndex(): Promise<RetrievalIndex> {
  indexPromise ??= loadCorpus().then(buildIndex);
  return indexPromise;
}

const catalogue = moduleCatalogue(MODULES);
const moduleNames = new Map(MODULES.map((module) => [module.id, module.name]));

/**
 * Where the tutor lives.
 *
 * In dev it is a route on the dev server itself (see `tutorDevRoute` in vite.config.ts), which
 * means the tutor works locally with a key in `.env.local` and no Supabase deploy at all. Same
 * origin, so no CORS and no preflight. In production it is the edge function, which is the only
 * one of the two that needs a signed-in learner.
 */
const DEV_ENDPOINT = '/api/chat';

/** Read per call, not at module load, so a test can exercise both paths rather than only the
 * one the test runner happens to be in. */
function usingDevRoute(): boolean {
  return isDev();
}

function endpoint(): string {
  return usingDevRoute() ? DEV_ENDPOINT : `${supabaseUrl}/functions/v1/chat`;
}

async function accessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export interface UseChatOptions {
  /** The module the learner is looking at, if they are on one. */
  moduleId?: string;
  weakSpots: readonly WeakSpot[];
}

export interface UseChat {
  messages: ChatMessage[];
  status: ChatStatus;
  /** Set when a send failed. Rendered beside the transcript, not thrown. */
  error: string | null;
  send: (text: string) => void;
  stop: () => void;
  clear: () => void;
}

export function useChat({ moduleId, weakSpots }: UseChatOptions): UseChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setStatus('idle');
  }, []);

  const clear = useCallback(() => {
    abort.current?.abort();
    abort.current = null;
    setMessages([]);
    setError(null);
    setStatus('idle');
  }, []);

  const send = useCallback(
    (text: string) => {
      const question = text.trim();
      if (question.length === 0 || status !== 'idle') return;

      const history: ChatMessage[] = [...messages, { role: 'user', content: question }];
      setMessages(history);
      setError(null);
      setStatus('thinking');

      const controller = new AbortController();
      abort.current = controller;

      // Hoisted out of the try so every failure path below can fall back to it. Retrieval runs
      // before the token check for the same reason: an expired session should still get an answer
      // from the app's own writing rather than only a banner.
      let retrieved: Chunk[] = [];

      void (async () => {
        try {
          const [token, index] = await Promise.all([accessToken(), retrievalIndex()]);
          retrieved = retrieve(index, question, { moduleId, limit: EXCERPT_LIMIT });

          // Only the edge function authenticates. The dev route has nothing to authenticate
          // against, and demanding a session for a localhost route would defeat its purpose.
          const dev = usingDevRoute();
          if (!dev && !token) {
            throw new Error('Your session has expired. Sign in again to keep going.');
          }

          const request: ChatRequest = {
            messages: history,
            context: {
              catalogue,
              excerpts: excerptsFrom(retrieved),
              ...(moduleId ? { currentModule: moduleNames.get(moduleId) ?? moduleId } : {}),
              ...(() => {
                const weakness = renderWeakness(weakSpots, (id) => moduleNames.get(id) ?? id);
                return weakness ? { weakness } : {};
              })(),
            },
          };

          const response = await fetch(endpoint(), {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...(dev
                ? {}
                : {
                    Authorization: `Bearer ${token}`,
                    apikey: supabaseAnonKey ?? '',
                  }),
            },
            body: JSON.stringify(request),
          });

          if (!response.ok || !response.body) {
            // The function answers with a readable message for every case it knows about —
            // expired session, daily cap, malformed request — so prefer it to a status code.
            const message = await response
              .json()
              .then((body: { message?: string }) => body.message)
              .catch(() => undefined);
            throw new Error(message ?? 'The tutor could not answer just now. Try again in a moment.');
          }

          await consume(response.body, controller.signal, setMessages, setStatus);
        } catch (caught) {
          if (controller.signal.aborted) return;

          // A failed fetch throws a TypeError carrying the browser's own wording — "Failed to
          // fetch" — which tells a learner nothing and is what an undeployed function looks like.
          const reason =
            caught instanceof TypeError
              ? 'The tutor could not be reached — it may not be set up yet, or you may be offline.'
              : caught instanceof Error
                ? caught.message
                : 'Something went wrong.';

          setError(reason);

          // Not a dead end: the app already holds a good answer to most questions, so show it
          // rather than leaving the learner with an error and nothing else. Undefined when
          // retrieval found nothing, in which case the banner stands alone.
          const fallback = corpusAnswer(retrieved, reason);
          if (fallback) {
            setMessages((current) => [
              ...current,
              {
                role: 'assistant',
                content: fallback.content,
                source: 'corpus',
                citations: fallback.citations,
              },
            ]);
          }

          setStatus('idle');
        } finally {
          if (abort.current === controller) abort.current = null;
        }
      })();
    },
    [messages, moduleId, status, weakSpots],
  );

  return { messages, status, error, send, stop, clear };
}

/**
 * Read the SSE body, appending text to the assistant's turn as it arrives.
 *
 * The assistant message is created on the first text frame rather than up front, so a request
 * that fails before any text does not leave an empty bubble in the transcript.
 *
 * The running answer is accumulated in a local rather than derived from previous state inside
 * the updater. React defers updaters, so a flag set beside `setMessages` has already flipped by
 * the time the first one runs — which silently dropped every frame that arrived in the same tick.
 */
async function consume(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setStatus: (status: ChatStatus) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let answer = '';
  let failure: string | null = null;

  const append = (text: string): void => {
    answer += text;
    const snapshot = answer;
    setMessages((current) => {
      const last = current.at(-1);
      return last?.role === 'assistant'
        ? [...current.slice(0, -1), { ...last, content: snapshot }]
        : [...current, { role: 'assistant', content: snapshot }];
    });
  };

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Frames are separated by a blank line; a partial frame stays in the buffer for next time.
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const payload = frame.replace(/^data: /, '').trim();
      if (!payload) continue;

      let event: { type?: string; text?: string; message?: string };
      try {
        event = JSON.parse(payload) as typeof event;
      } catch {
        continue;
      }

      if (event.type === 'text' && event.text) {
        setStatus('streaming');
        append(event.text);
      } else if (event.type === 'error') {
        failure = event.message ?? 'The tutor could not answer just now.';
      }
    }
  }

  setStatus('idle');
  if (failure) throw new Error(failure);
}
