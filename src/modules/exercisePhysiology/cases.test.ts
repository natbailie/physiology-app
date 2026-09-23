import { describe, expect, it } from 'vitest';
import { describeCaseSet } from '@/shared/assessment/caseSuite';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import { exerciseLoopConfig } from './engine/loopConfig';
import { DEFAULT_EXERCISE_INPUTS, EXERCISE_PRESETS } from './engine/presets';
import { EXERCISE_CASES } from './cases';
import { EXERCISE_QUESTIONS } from './questions';

describe('exercise cases', () => {
  describeCaseSet(exerciseLoopConfig, DEFAULT_EXERCISE_INPUTS, EXERCISE_PRESETS, EXERCISE_CASES, {
    healthyPreset: 'rest',
    // The same settle the pattern questions use, so a bed and the question asked about it are
    // read at the same point in the simulation.
    settleSeconds: 80000,
    questionIds: EXERCISE_QUESTIONS.map((q) => q.id),
  });
});

/**
 * The Questions tab runs what the beds do not.
 *
 * Asserted because the failure is silent: claim every question between the cases and the tab
 * still renders, with nothing in it and a practice button that does nothing.
 */
describe('the questions no bed claims', () => {
  it('is not empty, so the Questions tab has something to run', () => {
    expect(unclaimedQuestions(EXERCISE_QUESTIONS, EXERCISE_CASES).map((q) => q.id).length).toBeGreaterThan(0);
  });
});
