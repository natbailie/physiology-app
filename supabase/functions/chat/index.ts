/**
 * The tutor endpoint — the production path.
 *
 * It exists for one reason: the model API key must never reach a browser. Any `VITE_`-prefixed
 * variable is compiled into the bundle (see the comment in `src/billing/config.ts` about exactly
 * this hazard), so the key lives here, in `Deno.env`, set as an edge-function secret.
 *
 * Everything it says to the model lives in `../_shared/gemini.ts`, which the dev-server route in
 * `vite.config.ts` also imports. This file owns only what the shared module cannot: the access
 * gate, the per-user cap, and Deno's stream plumbing.
 *
 * Deploy:  supabase functions deploy chat
 * Secret:  supabase secrets set GEMINI_API_KEY=...
 * Locally: the dev-server route at /api/chat covers local work — no deploy needed.
 */

import { createClient } from 'npm:@supabase/supabase-js@^2.112.3';
import {
  BLOCKED_MESSAGE,
  ENDPOINT,
  MAX_REQUEST_BYTES,
  framePayload,
  geminiRequestBody,
  parseRequest,
  readFrame,
  splitFrames,
  upstreamMessage,
} from '../_shared/gemini.ts';

/**
 * Messages one learner may send per UTC day.
 *
 * The free tier is rate-limited per PROJECT, not per user, so every learner shares one allowance.
 * This cap is not about a bill — it stops one learner draining the quota for everyone.
 */
const DAILY_MESSAGE_CAP = 25;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function fail(status: number, message: string): Response {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return fail(405, 'Method not allowed.');

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!geminiKey || !supabaseUrl || !supabaseAnonKey) {
    return fail(500, 'The tutor is not configured on this deployment.');
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) return fail(401, 'Sign in to use the tutor.');

  const raw = await request.text();
  if (raw.length > MAX_REQUEST_BYTES) return fail(413, 'That conversation is too long. Start a new one.');

  let parsed;
  try {
    parsed = parseRequest(JSON.parse(raw));
  } catch {
    parsed = null;
  }
  if (!parsed) return fail(400, 'Malformed request.');

  // The learner's own token, so RLS applies exactly as it does everywhere else in the app.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return fail(401, 'Sign in to use the tutor.');

  // One row per message, counted since UTC midnight. Rows rather than a running total, matching
  // the design note at the top of schema.sql — an aggregate cannot be audited afterwards.
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from('chat_usage')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since.toISOString());

  if (countError) return fail(500, 'Could not check your usage. Try again in a moment.');
  if ((count ?? 0) >= DAILY_MESSAGE_CAP) {
    return fail(429, `You have used all ${DAILY_MESSAGE_CAP} tutor messages for today. They reset at midnight UTC.`);
  }

  const { error: usageError } = await supabase.from('chat_usage').insert({ user_id: auth.user.id });
  if (usageError) return fail(500, 'Could not record your usage. Try again in a moment.');

  let upstream: Response;
  try {
    upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a header rather than the query string, so the key stays out of request logs.
        'x-goog-api-key': geminiKey,
      },
      body: JSON.stringify(geminiRequestBody(parsed)),
    });
  } catch (error) {
    console.error('tutor upstream unreachable', error);
    return fail(502, 'The tutor could not be reached just now. Try again in a moment.');
  }

  // Answered as a normal error response rather than an SSE frame: nothing has streamed yet, so
  // the client's `!response.ok` branch reads the message and the panel falls back cleanly.
  if (!upstream.ok || !upstream.body) {
    const body = (await upstream.json().catch(() => null)) as { error?: { status?: string } } | null;
    return fail(502, upstreamMessage(upstream.status, body?.error?.status));
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (frame: Record<string, unknown>): void => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
      };

      const reader = upstream.body!.getReader();
      let buffer = '';
      let blocked = false;

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Gemini's frames are SSE too, but its own shape and CRLF-separated — see splitFrames.
          const split = splitFrames(buffer);
          buffer = split.rest;

          for (const frame of split.frames) {
            const payload = framePayload(frame);
            if (!payload) continue;

            const read = readFrame(payload);
            for (const text of read.text) send({ type: 'text', text });
            if (read.blocked) blocked = true;
          }
        }

        if (blocked) send({ type: 'error', message: BLOCKED_MESSAGE });
        else send({ type: 'done' });
      } catch (error) {
        console.error('tutor stream failed', error);
        send({ type: 'error', message: 'The tutor stopped part way through. Try again in a moment.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      ...CORS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
});
