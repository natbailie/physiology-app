import { useEffect, useMemo, useRef, useState } from 'react';
import { useModuleProgress } from '@/home/useModuleProgress';
import { MODULES } from '@/home/moduleRegistry';
import { useChat, type ChatMessage } from './useChat';
import styles from './ChatPanel.module.css';

export interface ChatPanelProps {
  /** The module the learner is looking at, if they are on one. */
  moduleId?: string;
  onClose: () => void;
}

/** Split a reply into paragraphs. The tutor is told to write plain prose, so this is the whole
 * renderer — a markdown parser would be a runtime dependency for something nothing needs. */
function paragraphsOf(text: string): string[] {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

function Turn({ message }: { message: ChatMessage }) {
  const fromCorpus = message.source === 'corpus';
  const className = message.role === 'user' ? styles.fromLearner : fromCorpus ? styles.fromCorpus : styles.fromTutor;

  return (
    <li className={className}>
      {/* Labelled, because these are the app's own words rather than an answer written for the
          question. Rendering the two identically would misrepresent where the prose came from. */}
      {fromCorpus && <p className={styles.provenance}>From the app&rsquo;s own material</p>}

      {paragraphsOf(message.content).map((paragraph, index) => (
        <p key={index} className={styles.paragraph}>
          {paragraph}
        </p>
      ))}

      {message.citations && message.citations.length > 0 && (
        <ul className={styles.citations}>
          {message.citations.map((citation) => (
            <li key={citation.title}>
              {citation.route ? (
                <a className={styles.citation} href={citation.route}>
                  {citation.title}
                </a>
              ) : (
                // A glossary entry has no page of its own, so it is named without a dead link.
                <span className={styles.citation}>{citation.title}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * The tutor panel.
 *
 * A fixed bottom sheet on narrow viewports and a bottom-right column above them, following the
 * one precedent the app already has for this shape — `ModulePage`'s control dock. There is no
 * modal anywhere in this app and this is not one: it does not trap focus or cover the page,
 * because a learner asking about the diagram behind it should still be able to look at it.
 */
export function ChatPanel({ moduleId, onClose }: ChatPanelProps) {
  const { weakSpots } = useModuleProgress();
  const { messages, status, error, send, stop, clear } = useChat({ moduleId, weakSpots });
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const transcriptRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Follow the answer as it streams in.
  useEffect(() => {
    const transcript = transcriptRef.current;
    if (transcript) transcript.scrollTop = transcript.scrollHeight;
  }, [messages, status]);

  const openers = useMemo(() => {
    const weakest = weakSpots[0];
    const name = weakest ? MODULES.find((module) => module.id === weakest.moduleId)?.name : undefined;
    return [
      'What should I revise next?',
      ...(name ? [`Why do I keep getting ${name} wrong?`] : []),
    ];
  }, [weakSpots]);

  const submit = (text: string): void => {
    send(text);
    setDraft('');
  };

  const busy = status !== 'idle';

  return (
    <section
      className={styles.panel}
      aria-label="Physiology tutor"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>Tutor</h2>
        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <button type="button" className={styles.ghostButton} onClick={clear}>
              New question
            </button>
          )}
          <button type="button" className={styles.ghostButton} onClick={onClose} aria-label="Close the tutor">
            Close
          </button>
        </div>
      </header>

      <ol className={styles.transcript} ref={transcriptRef} aria-live="polite" aria-busy={busy}>
        {messages.length === 0 && (
          <li className={styles.intro}>
            <p className={styles.paragraph}>
              Ask about anything in the app — a mechanism, a number, a drug class — or about your own
              record.
            </p>
            <div className={styles.openers}>
              {openers.map((opener) => (
                <button
                  key={opener}
                  type="button"
                  className={styles.opener}
                  onClick={() => submit(opener)}
                >
                  {opener}
                </button>
              ))}
            </div>
          </li>
        )}

        {messages.map((message, index) => (
          <Turn key={index} message={message} />
        ))}

        {/* Said in words as well as shown by the dots: `index.css` stops all animation under
            `prefers-reduced-motion`, so a spinner alone would say nothing to those readers. */}
        {busy && (
          <li className={styles.working}>
            <span className={styles.dots} aria-hidden="true" />
            {status === 'thinking' ? 'Thinking…' : 'Answering…'}
          </li>
        )}
      </ol>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <form
        className={styles.composer}
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <label className={styles.srOnly} htmlFor="tutor-question">
          Your question
        </label>
        <textarea
          id="tutor-question"
          ref={inputRef}
          className={styles.input}
          rows={2}
          value={draft}
          placeholder="Ask a physiology question…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends, shift-enter breaks the line — the convention every learner already
            // has from every other chat box.
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit(draft);
            }
          }}
        />
        {busy ? (
          <button type="button" className={styles.sendButton} onClick={stop}>
            Stop
          </button>
        ) : (
          <button type="submit" className={styles.sendButton} disabled={draft.trim().length === 0}>
            Ask
          </button>
        )}
      </form>
    </section>
  );
}
