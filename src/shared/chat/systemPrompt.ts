/**
 * What the tutor is told, and what it is given to answer from.
 *
 * The persona itself lives in the edge function, where a learner cannot edit it. Everything here
 * is *context* — the module catalogue, the retrieved excerpts, the learner's own record — which is
 * assembled on the client because that is where the corpus and the progress store already are.
 *
 * Nothing assembled here is trusted as instruction. The function fences it and says so; the worst
 * a learner can do by tampering with their own request is give themselves a worse answer, since
 * there are no tools behind this and no other learner's data within reach.
 */

import type { WeakSpot } from '@/shared/assessment/weakness';
import type { Chunk } from './corpus';

export interface ChatExcerpt {
  title: string;
  route?: string;
  text: string;
}

export interface ChatContext {
  /** Every module, so the tutor can send a learner to the right one. */
  catalogue: string;
  excerpts: ChatExcerpt[];
  /** Display name of the module the learner is looking at, if they are on one. */
  currentModule?: string;
  /** The study report, in prose, so "what am I weak at" is answered from the record. */
  weakness?: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatTurn[];
  context: ChatContext;
}

/** One line per available module. Stable across requests, which is what keeps the cache warm. */
export function moduleCatalogue(
  modules: readonly { id: string; name: string; tagline: string; status: string }[],
): string {
  return modules
    .filter((module) => module.status === 'available')
    .map((module) => `#${module.id} — ${module.name}: ${module.tagline}`)
    .join('\n');
}

/** The excerpts a learner's question earned, trimmed to what is worth sending. */
export function excerptsFrom(chunks: readonly Chunk[]): ChatExcerpt[] {
  return chunks.map((chunk) => ({
    title: chunk.title,
    ...(chunk.route ? { route: chunk.route } : {}),
    text: chunk.text,
  }));
}

const REASON_PHRASE: Record<WeakSpot['reason'], (spot: WeakSpot) => string> = {
  repeatedLapses: (spot) => `a question here has been missed ${spot.worstLapses} times`,
  lowAccuracy: (spot) => `${spot.correct} of ${spot.attempted} answered correctly`,
  stale: (spot) => `answered well but not for ${spot.daysSinceReview} days`,
  thinCoverage: (spot) => `${spot.unseen} of ${spot.totalQuestions} questions never attempted`,
};

/**
 * The study report as prose the model can quote.
 *
 * Deliberately the same facts the on-screen panel shows, so the tutor and the home page never
 * disagree about what a learner is weak at — the panel is the source of truth and this is a
 * rendering of it, not a second opinion.
 */
export function renderWeakness(
  weakSpots: readonly WeakSpot[],
  nameOf: (moduleId: string) => string,
  limit = 5,
): string | undefined {
  if (weakSpots.length === 0) return undefined;

  return weakSpots
    .slice(0, limit)
    .map((spot) => {
      const detail = REASON_PHRASE[spot.reason](spot);
      const due = spot.dueCount > 0 ? `, ${spot.dueCount} due for review` : '';
      return `- ${nameOf(spot.moduleId)} (#${spot.moduleId}): ${detail}${due}. Mastery ${Math.round(spot.mastery * 100)}%.`;
    })
    .join('\n');
}
