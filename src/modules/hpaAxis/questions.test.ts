import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { hpaLoopConfig } from './engine/loopConfig';
import { DEFAULT_HPA_INPUTS, HPA_PRESETS } from './engine/presets';
import { HPA_QUESTIONS } from './questions';
import type { HpaDerived, HpaInputs, HpaState } from './engine/types';
import type { HpaPresetName } from './engine/presets';

type Snapshot = { state: HpaState; derived: HpaDerived };

const patterns = HPA_QUESTIONS.filter(isPatternQuestion);
const predictions = HPA_QUESTIONS.filter(
  (q): q is PredictQuestion<HpaInputs, HpaPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('hpaAxis pattern questions', () => {
  describePatternSet(hpaLoopConfig, DEFAULT_HPA_INPUTS, HPA_PRESETS, patterns);
});

describe('hpaAxis predict questions', () => {
  describeQuestionSet(hpaLoopConfig, DEFAULT_HPA_INPUTS, HPA_PRESETS, predictions);
});
