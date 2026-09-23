import { describe, expect, it } from 'vitest';
import { describeCaseSet } from '@/shared/assessment/caseSuite';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import { respiratoryLoopConfig } from './engine/loopConfig';
import { DEFAULT_RESP_INPUTS, RESP_PRESETS } from './engine/presets';
import { RESP_CASES } from './cases';
import { RESPIRATORY_QUESTIONS } from './questions';

describe('respiratory cases', () => {
  describeCaseSet(respiratoryLoopConfig, DEFAULT_RESP_INPUTS, RESP_PRESETS, RESP_CASES, {
    healthyPreset: 'normal',
    // The settle the ABG questions use: a settled run in this module is a CHRONIC picture, and
    // reading a bed earlier than that would show a gas the case notes do not describe.
    settleSeconds: 3200,
    questionIds: RESPIRATORY_QUESTIONS.map((q) => q.id),
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
    expect(unclaimedQuestions(RESPIRATORY_QUESTIONS, RESP_CASES).map((q) => q.id).length).toBeGreaterThan(0);
  });
});
