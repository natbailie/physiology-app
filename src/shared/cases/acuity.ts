import {
  KNOWN_BOX,
  dueQuestions,
  unseenQuestions,
  type ReviewState,
} from '@/shared/assessment/scheduling';
import { LAPSE_THRESHOLD } from '@/shared/assessment/weakness';

/**
 * How urgent a bed is, for this learner, right now.
 *
 * - `crash` — something here has been forgotten at least twice. The sharpest signal the store
 *   holds, and the one worth interrupting a round for.
 * - `due` — a question has come round again on the ladder.
 * - `check` — every question retained past `KNOWN_BOX`. Nothing to do, and the bed says so.
 * - `newAdmission` — never attempted. Not weak; unmet.
 */
export type Acuity = 'crash' | 'due' | 'check' | 'newAdmission';

/** Sort order for the board: the patient who needs seeing first comes first. */
export const ACUITY_ORDER: readonly Acuity[] = ['crash', 'due', 'newAdmission', 'check'];

/**
 * Derived, never authored.
 *
 * A hand-typed acuity is stale the moment somebody answers a question, and it would say the same
 * thing to a learner who has never opened the module as to one who has known it for a month.
 * Reading it off the review ladder costs nothing — the schedule is already in memory for the
 * study strip — and means the ward changes shape as the learner does.
 *
 * `now` is a parameter for the reason `scheduling.ts` gives: a function that reads the clock
 * cannot be tested at a date of the caller's choosing.
 */
export function acuityOf(
  schedule: Record<string, ReviewState>,
  questionIds: readonly string[],
  now: number,
): Acuity {
  if (questionIds.length === 0) return 'newAdmission';

  const lapsed = questionIds.some((id) => (schedule[id]?.lapses ?? 0) >= LAPSE_THRESHOLD);
  if (lapsed) return 'crash';

  if (dueQuestions(schedule, questionIds, now).length > 0) return 'due';

  // Unseen is checked AFTER due, so a part-studied patient with work outstanding reads as due
  // rather than as somebody nobody has met. A bed is only a new admission if none of it has
  // been touched.
  if (unseenQuestions(schedule, questionIds).length === questionIds.length) return 'newAdmission';

  // Everything seen, nothing due, but not all of it retained yet — still in progress rather
  // than signed off. `due` is the honest answer: it will come round.
  const known = questionIds.filter((id) => (schedule[id]?.box ?? 0) >= KNOWN_BOX).length;
  return known === questionIds.length ? 'check' : 'due';
}
