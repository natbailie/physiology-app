import { describe, expect, it } from 'vitest';
import { applyRecord, emptyProgress, type PersistedProgress } from './progressStore';
import { rankWeaknesses, STALE_DAYS } from './weakness';

const DAY = 86_400_000;
/** A fixed Monday noon, so day-boundary arithmetic is inspectable rather than incidental. */
const MONDAY = new Date(2026, 7, 17, 12, 0, 0).getTime();

/**
 * Build a progress payload by actually answering questions, rather than hand-writing schedules.
 *
 * Going through `applyRecord` means these fixtures sit on the ladder the app would have put them
 * on — a test that hand-assembles a `ReviewState` can assert against a box position no sequence
 * of answers could ever produce.
 */
function answering(
  entries: { moduleId: string; questionId: string; correct: boolean; at: number }[],
): PersistedProgress {
  return entries.reduce(
    (all, entry) => applyRecord(all, entry.moduleId, entry.questionId, entry.correct, entry.at),
    emptyProgress(),
  );
}

const idsFor = (moduleId: string): string[] =>
  ({
    weak: ['q1', 'q2', 'q3', 'q4'],
    strong: ['q1', 'q2', 'q3', 'q4'],
    other: ['q1', 'q2', 'q3', 'q4'],
  })[moduleId] ?? [];

const MODULES = ['weak', 'strong', 'other'];

describe('what counts as weak', () => {
  it('leaves out a module never attempted', () => {
    // Unstudied is not the same as weak, and a report that lists forty untouched modules is a
    // catalogue rather than advice.
    const all = answering([{ moduleId: 'weak', questionId: 'q1', correct: false, at: MONDAY }]);

    const spots = rankWeaknesses(all.modules, idsFor, MODULES, MONDAY);

    expect(spots.map((spot) => spot.moduleId)).toEqual(['weak']);
  });

  it('leaves out a module answered correctly, recently, all the way through', () => {
    const all = answering(
      idsFor('strong').map((questionId) => ({
        moduleId: 'strong',
        questionId,
        correct: true,
        at: MONDAY,
      })),
    );

    expect(rankWeaknesses(all.modules, idsFor, MODULES, MONDAY)).toEqual([]);
  });

  it('flags a module where most of the questions have never been seen', () => {
    // Everything attempted was answered correctly, so nothing else is wrong with it. One
    // question out of four is still not a module anyone has worked through.
    const all = answering([{ moduleId: 'strong', questionId: 'q1', correct: true, at: MONDAY }]);

    const spot = rankWeaknesses(all.modules, idsFor, MODULES, MONDAY)[0];

    expect(spot?.moduleId).toBe('strong');
    expect(spot?.reason).toBe('thinCoverage');
    expect(spot?.unseen).toBe(3);
  });

  it('flags a module answered correctly but long ago', () => {
    const all = answering(
      idsFor('strong').map((questionId) => ({
        moduleId: 'strong',
        questionId,
        correct: true,
        at: MONDAY,
      })),
    );

    const spot = rankWeaknesses(all.modules, idsFor, MODULES, MONDAY + STALE_DAYS * DAY)[0];

    expect(spot?.reason).toBe('stale');
    expect(spot?.daysSinceReview).toBe(STALE_DAYS);
  });
});

describe('ranking', () => {
  it('puts a repeatedly forgotten module above one missed once', () => {
    // The ladder has already brought q1 back twice in `weak` and the learner has missed it both
    // times. That is a different problem from getting something wrong on first sight.
    const all = answering([
      { moduleId: 'weak', questionId: 'q1', correct: false, at: MONDAY },
      { moduleId: 'weak', questionId: 'q1', correct: false, at: MONDAY + DAY },
      { moduleId: 'weak', questionId: 'q1', correct: false, at: MONDAY + 2 * DAY },
      { moduleId: 'other', questionId: 'q1', correct: false, at: MONDAY },
      { moduleId: 'other', questionId: 'q2', correct: true, at: MONDAY },
      { moduleId: 'other', questionId: 'q3', correct: true, at: MONDAY },
    ]);

    const spots = rankWeaknesses(all.modules, idsFor, MODULES, MONDAY + 2 * DAY);

    expect(spots[0]?.moduleId).toBe('weak');
    expect(spots[0]?.reason).toBe('repeatedLapses');
    expect(spots[0]?.worstLapses).toBe(3);
  });

  it('names low accuracy when nothing has been forgotten twice', () => {
    const all = answering([
      { moduleId: 'other', questionId: 'q1', correct: false, at: MONDAY },
      { moduleId: 'other', questionId: 'q2', correct: false, at: MONDAY },
      { moduleId: 'other', questionId: 'q3', correct: true, at: MONDAY },
      { moduleId: 'other', questionId: 'q4', correct: true, at: MONDAY },
    ]);

    const spot = rankWeaknesses(all.modules, idsFor, MODULES, MONDAY)[0];

    expect(spot?.reason).toBe('lowAccuracy');
    expect(spot?.accuracy).toBe(0.5);
    expect(spot?.worstLapses).toBe(1);
  });

  it('counts questions still due for review', () => {
    const all = answering([
      { moduleId: 'weak', questionId: 'q1', correct: false, at: MONDAY },
      { moduleId: 'weak', questionId: 'q2', correct: false, at: MONDAY },
    ]);

    // Both were missed, so both are back at box 0 and due immediately.
    expect(rankWeaknesses(all.modules, idsFor, MODULES, MONDAY)[0]?.dueCount).toBe(2);
  });

  it('orders deterministically when two modules score the same', () => {
    const all = answering([
      { moduleId: 'weak', questionId: 'q1', correct: false, at: MONDAY },
      { moduleId: 'other', questionId: 'q1', correct: false, at: MONDAY },
    ]);

    const forwards = rankWeaknesses(all.modules, idsFor, ['weak', 'other'], MONDAY);
    const backwards = rankWeaknesses(all.modules, idsFor, ['other', 'weak'], MONDAY);

    expect(forwards.map((spot) => spot.moduleId)).toEqual(backwards.map((spot) => spot.moduleId));
  });
});
