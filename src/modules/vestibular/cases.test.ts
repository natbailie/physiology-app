import { describe, expect, it } from 'vitest';
import { describeCaseSet } from '@/shared/assessment/caseSuite';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import { vestibularLoopConfig } from './engine/loopConfig';
import { DEFAULT_VESTIBULAR_INPUTS, VESTIBULAR_PRESETS } from './engine/presets';
import { VESTIBULAR_CASES } from './cases';
import { VESTIBULAR_QUESTIONS } from './questions';

describe('vestibular cases', () => {
  describeCaseSet(vestibularLoopConfig, DEFAULT_VESTIBULAR_INPUTS, VESTIBULAR_PRESETS, VESTIBULAR_CASES, {
    healthyPreset: 'normal',
    // The same settle the pattern questions use, so a bed and the question asked about it are
    // read at the same point in the simulation.
    settleSeconds: 40,
    questionIds: VESTIBULAR_QUESTIONS.map((q) => q.id),
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
    expect(unclaimedQuestions(VESTIBULAR_QUESTIONS, VESTIBULAR_CASES).map((q) => q.id).length).toBeGreaterThan(0);
  });
});
