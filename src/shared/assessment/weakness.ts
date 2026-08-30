/**
 * Where a learner is weak, and why.
 *
 * The store already knows everything needed for this — box position, lapse count, last-answered
 * timestamp, tally. What it has never done is rank modules against each other and say which one
 * to open. That is the whole job here.
 *
 * Pure, and takes its time from the caller, for the same reason `scheduling.ts` does: staleness
 * is the one signal whose interesting behaviour lives at day boundaries, and a function that
 * reads the clock cannot be tested there.
 *
 * `reason` is a tag rather than a sentence. Prose belongs in the component, where British
 * spelling and sentence case are already the house rules, and a test that asserts a tag survives
 * rewording the copy.
 */

import type { ModuleSummary } from './progressStore';
import { dueQuestions, mastery as masteryOf, unseenQuestions } from './scheduling';

const DAY_MS = 86_400_000;

/**
 * Why a module is on the list, most diagnostic first.
 *
 * A question forgotten twice is the sharpest signal in the store — it means the ladder has
 * already put it back and the learner has missed it again, which no single wrong answer tells
 * you. Accuracy comes next, then decay, then how much of the module has never been seen.
 */
export type WeaknessReason = 'repeatedLapses' | 'lowAccuracy' | 'stale' | 'thinCoverage';

/** A question missed this many times has been genuinely forgotten, not merely got wrong once. */
export const LAPSE_THRESHOLD = 2;
/** Below this share correct, the module is not being retained. */
export const ACCURACY_THRESHOLD = 0.7;
/** Past this many days without an answer, box position overstates what is still known. */
export const STALE_DAYS = 14;
/** More than this share of the module never attempted is a coverage problem, not a recall one. */
export const UNSEEN_THRESHOLD = 0.5;

export interface WeakSpot {
  moduleId: string;
  attempted: number;
  correct: number;
  /** Share of attempts answered correctly, all-time. */
  accuracy: number;
  /** Box-based, counting unseen questions as zero — see `mastery` in scheduling.ts. */
  mastery: number;
  /** Total times any question in this module has been forgotten. */
  lapses: number;
  /** The worst single question's lapse count, which is what `repeatedLapses` keys on. */
  worstLapses: number;
  dueCount: number;
  unseen: number;
  totalQuestions: number;
  /** Whole days since the most recent answer in this module. */
  daysSinceReview: number;
  reason: WeaknessReason;
  /** Rank key, 0-1. Higher is weaker. */
  score: number;
}

function summarise(
  moduleId: string,
  summary: ModuleSummary,
  questionIds: readonly string[],
  now: number,
): WeakSpot | null {
  const schedule = summary.schedule;
  const states = Object.values(schedule);

  const accuracy = summary.attempted > 0 ? summary.correct / summary.attempted : 0;
  const lapses = states.reduce((sum, state) => sum + state.lapses, 0);
  const worstLapses = states.reduce((worst, state) => Math.max(worst, state.lapses), 0);
  const lastAt = states.reduce((latest, state) => Math.max(latest, state.lastAt), 0);
  const daysSinceReview = lastAt > 0 ? Math.floor((now - lastAt) / DAY_MS) : 0;

  const unseen = unseenQuestions(schedule, questionIds).length;
  const unseenShare = questionIds.length > 0 ? unseen / questionIds.length : 0;
  const mastery = masteryOf(schedule, questionIds);

  const reason: WeaknessReason | null =
    worstLapses >= LAPSE_THRESHOLD
      ? 'repeatedLapses'
      : accuracy < ACCURACY_THRESHOLD
        ? 'lowAccuracy'
        : daysSinceReview >= STALE_DAYS
          ? 'stale'
          : unseenShare > UNSEEN_THRESHOLD
            ? 'thinCoverage'
            : null;

  // A module answered accurately, never forgotten, reviewed recently and worked all the way
  // through is not weak. Leaving it out is what makes the list worth reading.
  if (reason === null) return null;

  // Four signals on the same 0-1 scale. Mastery leads because it is the only one that accounts
  // for the whole module rather than the part that has been visited; staleness trails because a
  // fortnight's gap on well-known material is a smaller problem than a question missed twice.
  const lapseRate = summary.attempted > 0 ? Math.min(lapses / summary.attempted, 1) : 0;
  const decay = Math.min(daysSinceReview / 30, 1);
  const score = 0.4 * (1 - mastery) + 0.3 * (1 - accuracy) + 0.2 * lapseRate + 0.1 * decay;

  return {
    moduleId,
    attempted: summary.attempted,
    correct: summary.correct,
    accuracy,
    mastery,
    lapses,
    worstLapses,
    dueCount: dueQuestions(schedule, questionIds, now).length,
    unseen,
    totalQuestions: questionIds.length,
    daysSinceReview,
    reason,
    score,
  };
}

/**
 * Every module with something wrong with it, weakest first.
 *
 * Only modules the learner has actually attempted. A module never opened is unstudied, not weak —
 * the same distinction `dueQuestions` draws between "due" and "unseen", and telling someone they
 * are weak at forty modules they have never opened is not a study report, it is a catalogue.
 */
export function rankWeaknesses(
  summaries: Record<string, ModuleSummary>,
  questionIdsFor: (moduleId: string) => readonly string[],
  moduleIds: readonly string[],
  now: number,
): WeakSpot[] {
  const spots: WeakSpot[] = [];

  for (const moduleId of moduleIds) {
    const summary = summaries[moduleId];
    if (!summary || summary.attempted === 0) continue;

    const spot = summarise(moduleId, summary, questionIdsFor(moduleId), now);
    if (spot) spots.push(spot);
  }

  // Ties break on module id so the report does not reshuffle between renders.
  return spots.sort((a, b) => b.score - a.score || a.moduleId.localeCompare(b.moduleId));
}
