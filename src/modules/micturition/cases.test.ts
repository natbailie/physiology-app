import { describe, expect, it } from 'vitest';
import { describeCaseSet } from '@/shared/assessment/caseSuite';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import { micturitionLoopConfig } from './engine/loopConfig';
import { DEFAULT_MICTURITION_INPUTS, MICTURITION_PRESETS } from './engine/presets';
import { MICTURITION_CASES } from './cases';
import { MICTURITION_QUESTIONS } from './questions';

describe('micturition cases', () => {
  describeCaseSet(micturitionLoopConfig, DEFAULT_MICTURITION_INPUTS, MICTURITION_PRESETS, MICTURITION_CASES, {
    healthyPreset: 'normal',
    // A chosen point on a trajectory, not a settle: the bladder fills without end, so there is
    // no steady state to wait for. 3600 seconds is the questions' own readable point — the
    // setup volume plus an hour of filling — and a bed and the question asked about it are read
    // at the same point for that reason.
    settleSeconds: 3600,
    questionIds: MICTURITION_QUESTIONS.map((q) => q.id),
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
    expect(unclaimedQuestions(MICTURITION_QUESTIONS, MICTURITION_CASES).map((q) => q.id).length).toBeGreaterThan(0);
  });
});
