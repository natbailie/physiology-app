import { describe, expect, it } from 'vitest';
import { describeCaseSet } from '@/shared/assessment/caseSuite';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import { renalTubularLoopConfig } from './engine/loopConfig';
import { DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS } from './engine/presets';
import { RENAL_TUBULAR_CASES } from './cases';
import { RENAL_TUBULAR_QUESTIONS } from './questions';

describe('renal tubular cases', () => {
  describeCaseSet(renalTubularLoopConfig, DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS, RENAL_TUBULAR_CASES, {
    healthyPreset: 'normal',
    // The same settle the pattern question uses, so a bed and the question asked about it are
    // read at the same point in the simulation.
    settleSeconds: 90000,
    questionIds: RENAL_TUBULAR_QUESTIONS.map((q) => q.id),
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
    expect(unclaimedQuestions(RENAL_TUBULAR_QUESTIONS, RENAL_TUBULAR_CASES).map((q) => q.id).length).toBeGreaterThan(0);
  });
});
