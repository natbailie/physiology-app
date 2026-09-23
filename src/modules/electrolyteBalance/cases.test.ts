import { describe, expect, it } from 'vitest';
import { describeCaseSet } from '@/shared/assessment/caseSuite';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import { electrolyteLoopConfig } from './engine/loopConfig';
import { DEFAULT_ELECTROLYTE_INPUTS, ELECTROLYTE_PRESETS } from './engine/presets';
import { ELECTROLYTE_CASES } from './cases';
import { ELECTROLYTE_QUESTIONS } from './questions';

describe('electrolyte cases', () => {
  describeCaseSet(electrolyteLoopConfig, DEFAULT_ELECTROLYTE_INPUTS, ELECTROLYTE_PRESETS, ELECTROLYTE_CASES, {
    healthyPreset: 'normal',
    // The same settle the pattern questions use, so a bed and the question asked about it are
    // read at the same point in the simulation — roughly eleven hours, where the three causes
    // have genuinely separated.
    settleSeconds: 40000,
    questionIds: ELECTROLYTE_QUESTIONS.map((q) => q.id),
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
    expect(unclaimedQuestions(ELECTROLYTE_QUESTIONS, ELECTROLYTE_CASES).map((q) => q.id).length).toBeGreaterThan(0);
  });
});
