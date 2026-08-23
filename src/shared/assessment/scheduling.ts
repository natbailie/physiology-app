/**
 * Spaced repetition over missed questions.
 *
 * Deliberately a Leitner box ladder rather than anything cleverer. The learners this is built
 * for are Anki-trained, so a scheme they can predict — get it right, wait longer; get it wrong,
 * start again — is worth more than a better-tuned one they cannot reason about.
 *
 * Everything here is pure and takes its time from the caller. No `Date.now()`, for the same
 * reason the engines have none: a scheduler that reads the clock cannot be tested at the day
 * boundaries where all its interesting behaviour lives.
 */

export interface ReviewState {
  /** Position on the ladder, 0-5. Zero means due now. */
  box: number;
  /** When this question next becomes due, epoch ms. */
  dueAt: number;
  /** How many times it has been forgotten. Never decreases — a question you keep missing is
   * worth surfacing even once it is technically not due. */
  lapses: number;
  /** When it was last answered, epoch ms. */
  lastAt: number;
}

const DAY_MS = 86_400_000;

/**
 * Days to wait at each box.
 *
 * Box 0 is zero on purpose: a question just answered wrong is due immediately, so it comes back
 * within the same review session rather than tomorrow. Getting it right at the end of a session
 * you got it wrong in is most of the value of reviewing at all.
 */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35] as const;

export const MAX_BOX = BOX_INTERVAL_DAYS.length - 1;

/** Where a question sits after being answered. */
export function reviewAfter(previous: ReviewState | undefined, correct: boolean, at: number): ReviewState {
  const box = previous?.box ?? 0;
  const lapses = previous?.lapses ?? 0;

  if (!correct) {
    // All the way back to the start. Partial credit for a question you have just demonstrated
    // you do not know would only delay meeting it again.
    return { box: 0, dueAt: at, lapses: lapses + 1, lastAt: at };
  }

  const nextBox = Math.min(box + 1, MAX_BOX);
  return {
    box: nextBox,
    dueAt: at + BOX_INTERVAL_DAYS[nextBox]! * DAY_MS,
    lapses,
    lastAt: at,
  };
}

/**
 * Which questions are due, most overdue first.
 *
 * Only questions that have actually been seen and have come round again. A question never
 * attempted is not "due" — it is unstudied, which is a different prompt and a different button.
 * Ties break toward the question that has been forgotten most often.
 */
export function dueQuestions(
  schedule: Record<string, ReviewState>,
  questionIds: readonly string[],
  now: number,
): string[] {
  return questionIds
    .filter((id) => {
      const state = schedule[id];
      return state !== undefined && state.dueAt <= now;
    })
    .sort((a, b) => {
      const left = schedule[a]!;
      const right = schedule[b]!;
      if (left.dueAt !== right.dueAt) return left.dueAt - right.dueAt;
      return right.lapses - left.lapses;
    });
}

/** Questions never attempted, in authoring order. */
export function unseenQuestions(
  schedule: Record<string, ReviewState>,
  questionIds: readonly string[],
): string[] {
  return questionIds.filter((id) => schedule[id] === undefined);
}

/**
 * How well a module is known, 0-1.
 *
 * Box position rather than percentage correct, because the two answer different questions. A
 * learner who got everything right on the first pass three weeks ago and has not returned does
 * not know the module better than one who has been through it four times — and only the ladder
 * can tell them apart. Unseen questions count as zero, so mastery reflects the whole module
 * rather than the part that has been visited.
 */
export function mastery(schedule: Record<string, ReviewState>, questionIds: readonly string[]): number {
  if (questionIds.length === 0) return 0;
  const total = questionIds.reduce((sum, id) => sum + (schedule[id]?.box ?? 0), 0);
  return total / (questionIds.length * MAX_BOX);
}

/**
 * The box at which a question counts as known.
 *
 * Box 3 means it has survived a week-long gap, which is a defensible line between "answered
 * correctly once" and "actually retained". Anything below it is in progress.
 */
export const KNOWN_BOX = 3;

/** How many of `questionIds` have been retained rather than merely answered. */
export function knownCount(schedule: Record<string, ReviewState>, questionIds: readonly string[]): number {
  return questionIds.filter((id) => (schedule[id]?.box ?? 0) >= KNOWN_BOX).length;
}

/** Local calendar date for a timestamp, as `YYYY-MM-DD`. */
export function studyDayOf(at: number): string {
  const date = new Date(at);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The day before a `YYYY-MM-DD` string, handling month and year boundaries. */
function previousDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return studyDayOf(new Date(year!, month! - 1, date! - 1).getTime());
}

/**
 * Consecutive days studied, counting back from today.
 *
 * Studying today extends the streak; studying yesterday but not yet today keeps it alive rather
 * than breaking it, because a streak that resets at midnight punishes the learner for not having
 * opened the app yet on a day that is not over. Anything older is broken.
 */
export function currentStreak(studyDays: readonly string[], now: number): number {
  if (studyDays.length === 0) return 0;
  const days = new Set(studyDays);
  const today = studyDayOf(now);

  let cursor = days.has(today) ? today : previousDay(today);
  if (!days.has(cursor)) return 0;

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}
