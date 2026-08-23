import { describe, expect, it } from 'vitest';
import {
  BOX_INTERVAL_DAYS,
  MAX_BOX,
  currentStreak,
  dueQuestions,
  mastery,
  reviewAfter,
  studyDayOf,
  unseenQuestions,
  type ReviewState,
} from './scheduling';

const DAY = 86_400_000;
/** A fixed Monday noon, so day-boundary arithmetic is inspectable rather than incidental. */
const MONDAY = new Date(2026, 7, 17, 12, 0, 0).getTime();

/** Answer a question `outcomes` in sequence, one day apart, and report where it lands. */
function afterOutcomes(outcomes: boolean[], start = MONDAY): ReviewState | undefined {
  let state: ReviewState | undefined;
  outcomes.forEach((correct, index) => {
    state = reviewAfter(state, correct, start + index * DAY);
  });
  return state;
}

describe('the ladder', () => {
  it('brings a question you just got wrong back in the same session', () => {
    // Not tomorrow. Getting right, at the end of a session, something you opened it not knowing
    // is most of the value of reviewing at all.
    const state = reviewAfter(undefined, false, MONDAY);
    expect(state.dueAt).toBe(MONDAY);
    expect(state.box).toBe(0);
  });

  it('pushes a question further out each time it is answered correctly', () => {
    const first = reviewAfter(undefined, true, MONDAY);
    const second = reviewAfter(first, true, MONDAY);
    const third = reviewAfter(second, true, MONDAY);

    expect(first.dueAt - MONDAY).toBeLessThan(second.dueAt - MONDAY);
    expect(second.dueAt - MONDAY).toBeLessThan(third.dueAt - MONDAY);
  });

  it('sends a forgotten question all the way back, however well it was known', () => {
    // Partial credit for something the learner has just demonstrated they do not know would
    // only delay meeting it again.
    const wellKnown = afterOutcomes([true, true, true, true]);
    expect(wellKnown!.box).toBe(4);

    const forgotten = reviewAfter(wellKnown, false, MONDAY + 10 * DAY);
    expect(forgotten.box).toBe(0);
    expect(forgotten.dueAt).toBe(MONDAY + 10 * DAY);
  });

  it('counts lapses without ever forgiving them', () => {
    const state = afterOutcomes([false, true, false, true, true]);
    expect(state!.lapses).toBe(2);
  });

  it('caps the interval rather than growing without limit', () => {
    const state = afterOutcomes(Array.from({ length: 12 }, () => true));
    expect(state!.box).toBe(MAX_BOX);
    expect(state!.dueAt - state!.lastAt).toBe(BOX_INTERVAL_DAYS[MAX_BOX]! * DAY);
  });

  it('makes you wait less for a repeatedly-missed question than a once-correct one', () => {
    // The whole point of the ladder, stated as the WAIT from the last attempt rather than an
    // absolute date — the two questions were last seen on different days, so comparing due
    // dates directly would measure the schedule of the test rather than of the scheduler.
    const missed = afterOutcomes([false, false, false])!;
    const known = afterOutcomes([true])!;
    expect(missed.dueAt - missed.lastAt).toBeLessThan(known.dueAt - known.lastAt);
  });
});

describe('what is due', () => {
  const schedule: Record<string, ReviewState> = {
    overdue: { box: 1, dueAt: MONDAY - 3 * DAY, lapses: 0, lastAt: MONDAY - 4 * DAY },
    justDue: { box: 1, dueAt: MONDAY, lapses: 0, lastAt: MONDAY - DAY },
    notYet: { box: 3, dueAt: MONDAY + 5 * DAY, lapses: 0, lastAt: MONDAY },
  };
  const ids = ['notYet', 'justDue', 'overdue', 'neverSeen'];

  it('returns only questions that have come round again, most overdue first', () => {
    expect(dueQuestions(schedule, ids, MONDAY)).toEqual(['overdue', 'justDue']);
  });

  it('does not call an unattempted question due', () => {
    // It is unstudied, which is a different prompt and a different button.
    expect(dueQuestions(schedule, ids, MONDAY)).not.toContain('neverSeen');
    expect(unseenQuestions(schedule, ids)).toEqual(['neverSeen']);
  });

  it('breaks ties toward the question forgotten most often', () => {
    const tied: Record<string, ReviewState> = {
      easy: { box: 1, dueAt: MONDAY, lapses: 0, lastAt: MONDAY },
      hard: { box: 1, dueAt: MONDAY, lapses: 4, lastAt: MONDAY },
    };
    expect(dueQuestions(tied, ['easy', 'hard'], MONDAY)).toEqual(['hard', 'easy']);
  });

  it('is empty for a module that has never been opened', () => {
    expect(dueQuestions({}, ids, MONDAY)).toEqual([]);
  });
});

describe('mastery', () => {
  it('is zero for a module never attempted', () => {
    expect(mastery({}, ['a', 'b', 'c'])).toBe(0);
  });

  it('counts unseen questions against you, so it describes the whole module', () => {
    const half: Record<string, ReviewState> = {
      a: { box: MAX_BOX, dueAt: MONDAY, lapses: 0, lastAt: MONDAY },
    };
    expect(mastery(half, ['a', 'b'])).toBeCloseTo(0.5, 5);
  });

  it('reaches one only when every question is at the top of the ladder', () => {
    const ids = ['a', 'b'];
    const top = Object.fromEntries(
      ids.map((id) => [id, { box: MAX_BOX, dueAt: MONDAY, lapses: 0, lastAt: MONDAY }]),
    );
    expect(mastery(top, ids)).toBeCloseTo(1, 5);
  });

  it('separates a learner who has been through four times from one who guessed right once', () => {
    // Percentage correct cannot tell these apart; box position is the whole reason to use it.
    const onePass = { q: afterOutcomes([true])! };
    const fourPasses = { q: afterOutcomes([true, true, true, true])! };
    expect(mastery(fourPasses, ['q'])).toBeGreaterThan(mastery(onePass, ['q']));
  });
});

describe('streak', () => {
  const day = (offset: number) => studyDayOf(MONDAY + offset * DAY);

  it('is zero with no history', () => {
    expect(currentStreak([], MONDAY)).toBe(0);
  });

  it('counts consecutive days back from today', () => {
    expect(currentStreak([day(-2), day(-1), day(0)], MONDAY)).toBe(3);
  });

  it('survives a day that is not over yet', () => {
    // Studied yesterday, not yet today. Resetting at midnight would punish the learner for not
    // having opened the app before lunch.
    expect(currentStreak([day(-2), day(-1)], MONDAY)).toBe(2);
  });

  it('breaks once a whole day has been skipped', () => {
    expect(currentStreak([day(-5), day(-4), day(-3)], MONDAY)).toBe(0);
  });

  it('ignores a gap earlier in the history', () => {
    expect(currentStreak([day(-9), day(-8), day(-1), day(0)], MONDAY)).toBe(2);
  });

  it('does not double-count two sessions on the same day', () => {
    expect(currentStreak([day(0), day(0)], MONDAY)).toBe(1);
  });

  it('counts across a month boundary', () => {
    const firstOfMonth = new Date(2026, 8, 1, 12).getTime();
    const days = [studyDayOf(firstOfMonth - DAY), studyDayOf(firstOfMonth)];
    expect(currentStreak(days, firstOfMonth)).toBe(2);
  });
});
