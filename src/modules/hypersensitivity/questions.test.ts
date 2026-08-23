import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { hypersensitivityLoopConfig } from './engine/loopConfig';
import { DEFAULT_HYPERSENSITIVITY_INPUTS, HYPERSENSITIVITY_PRESETS } from './engine/presets';
import { HYPERSENSITIVITY_QUESTIONS } from './questions';
import type { HypersensitivityDerived, HypersensitivityInputs, HypersensitivityState } from './engine/types';
import type { HypersensitivityPresetName } from './engine/presets';

type Snapshot = { state: HypersensitivityState; derived: HypersensitivityDerived };

// Naming the type from onset and a lab panel is the pattern-discrimination problem this module
// exists for; what a treatment does to a given arm is a prediction.
const patterns = HYPERSENSITIVITY_QUESTIONS.filter(isPatternQuestion);
const predictions = HYPERSENSITIVITY_QUESTIONS.filter(
  (q): q is PredictQuestion<HypersensitivityInputs, HypersensitivityPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('hypersensitivity pattern questions', () => {
  describePatternSet(hypersensitivityLoopConfig, DEFAULT_HYPERSENSITIVITY_INPUTS, HYPERSENSITIVITY_PRESETS, patterns);
});

describe('hypersensitivity predict questions', () => {
  describeQuestionSet(hypersensitivityLoopConfig, DEFAULT_HYPERSENSITIVITY_INPUTS, HYPERSENSITIVITY_PRESETS, predictions);
});
