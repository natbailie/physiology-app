/**
 * What to say when the tutor cannot.
 *
 * The app already contains a good answer to most of what a learner will ask — 105,000 words of
 * authored, test-floored prose, and `retrieve` reliably finds the right passage. So a tutor that
 * is unreachable, out of quota or past the daily cap is not a reason to show a learner nothing.
 *
 * This is deliberately NOT a generated answer and must never be mistaken for one. It quotes the
 * app's own writing verbatim and is labelled as such by `ChatPanel`, because a learner has to be
 * able to tell an authored passage from a synthesised one.
 *
 * Pure and offline: no network, no key, no quota, and testable without either.
 */

import type { Chunk } from './corpus';

export interface CorpusCitation {
  title: string;
  route?: string;
}

export interface CorpusAnswer {
  content: string;
  citations: CorpusCitation[];
}

/**
 * How many passages to show.
 *
 * Three is about as much as anyone reads before scrolling past. Beyond that the ranking is doing
 * the learner's filtering badly rather than well.
 */
const MAX_PASSAGES = 3;

/**
 * An answer assembled from the app's own material, or undefined when there is nothing to say.
 *
 * `chunks` are the ones `retrieve` already returned for this question — deliberately passed in
 * rather than retrieved again, so the fallback shows exactly what the tutor would have been
 * reading. When retrieval found nothing, this returns undefined: there is no honest answer to
 * give, and inventing a vague one would be worse than the error message on its own.
 */
export function corpusAnswer(chunks: readonly Chunk[], reason: string): CorpusAnswer | undefined {
  const passages = chunks.slice(0, MAX_PASSAGES);
  if (passages.length === 0) return undefined;

  const lead = `${reason} Here is what the app itself says.`;
  const body = passages.map((chunk) => `${chunk.title}\n${chunk.text}`).join('\n\n');

  return {
    content: `${lead}\n\n${body}`,
    citations: passages.map((chunk) => ({
      title: chunk.title,
      ...(chunk.route ? { route: chunk.route } : {}),
    })),
  };
}
