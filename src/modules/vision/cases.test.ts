import { describe, expect, it } from 'vitest';
import { describeCaseSet } from '@/shared/assessment/caseSuite';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import { visionLoopConfig } from './engine/loopConfig';
import { DEFAULT_VISION_INPUTS, VISION_PRESETS } from './engine/presets';
import { VISION_CASES } from './cases';
import { VISION_QUESTIONS } from './questions';

describe('vision cases', () => {
  describeCaseSet(visionLoopConfig, DEFAULT_VISION_INPUTS, VISION_PRESETS, VISION_CASES, {
    healthyPreset: 'normalDaylight',
    // The slowest of the pattern settles the beds share: the retinal and field panels are at
    // steady state long before it, and a bed and the question asked about it are read at the
    // same point for that reason. Acute closure needs the full eleven thousand seconds.
    settleSeconds: 11000,
    questionIds: VISION_QUESTIONS.map((q) => q.id),
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
    expect(unclaimedQuestions(VISION_QUESTIONS, VISION_CASES).map((q) => q.id).length).toBeGreaterThan(0);
  });
});
