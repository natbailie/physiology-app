import { describe, expect, it } from 'vitest';
import { describeCaseSet } from '@/shared/assessment/caseSuite';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import { thermoLoopConfig } from './engine/loopConfig';
import { DEFAULT_THERMO_INPUTS, THERMO_PRESETS } from './engine/presets';
import { THERMO_CASES } from './cases';
import { THERMO_QUESTIONS } from './questions';

describe('thermoregulation cases', () => {
  describeCaseSet(thermoLoopConfig, DEFAULT_THERMO_INPUTS, THERMO_PRESETS, THERMO_CASES, {
    healthyPreset: 'normothermic',
    // The same settle the pattern questions use, so a bed and the question asked about it are
    // read at the same point in the simulation.
    settleSeconds: 500000,
    questionIds: THERMO_QUESTIONS.map((q) => q.id),
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
    expect(unclaimedQuestions(THERMO_QUESTIONS, THERMO_CASES).map((q) => q.id).length).toBeGreaterThan(0);
  });
});
