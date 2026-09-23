import { describe, expect, it } from 'vitest';
import { describeCaseSet } from '@/shared/assessment/caseSuite';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import { cardiorenalLoopConfig } from './engine/loopConfig';
import { DEFAULT_INPUTS, PRESETS } from './engine/presets';
import { CARDIORENAL_CASES } from './cases';
import { CARDIORENAL_QUESTIONS } from './questions';

describe('cardiorenal cases', () => {
  describeCaseSet(cardiorenalLoopConfig, DEFAULT_INPUTS, PRESETS, CARDIORENAL_CASES, {
    healthyPreset: 'normal',
    // This engine runs the slow renal arm; a bed read before it has finished is a patient
    // halfway into their own illness.
    settleSeconds: 4000,
    questionIds: CARDIORENAL_QUESTIONS.map((q) => q.id),
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
    expect(unclaimedQuestions(CARDIORENAL_QUESTIONS, CARDIORENAL_CASES).map((q) => q.id).length).toBeGreaterThan(0);
  });
});
