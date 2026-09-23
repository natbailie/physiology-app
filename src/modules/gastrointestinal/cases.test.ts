import { describe, expect, it } from 'vitest';
import { describeCaseSet } from '@/shared/assessment/caseSuite';
import { unclaimedQuestions } from '@/shared/cases/unclaimed';
import { giLoopConfig } from './engine/loopConfig';
import { DEFAULT_GI_INPUTS, GI_PRESETS } from './engine/presets';
import { GI_CASES } from './cases';
import { GI_QUESTIONS } from './questions';

describe('gastrointestinal cases', () => {
  describeCaseSet(giLoopConfig, DEFAULT_GI_INPUTS, GI_PRESETS, GI_CASES, {
    // The healthy fed state, like for like: both beds eat, so the comparator eats too. A
    // fasting baseline would compare a fed pathology against an empty stomach.
    healthyPreset: 'normalMeal',
    // The module's own loop settle. Both beds are steady states on it.
    settleSeconds: 600,
    questionIds: GI_QUESTIONS.map((q) => q.id),
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
    expect(unclaimedQuestions(GI_QUESTIONS, GI_CASES).map((q) => q.id).length).toBeGreaterThan(0);
  });
});
