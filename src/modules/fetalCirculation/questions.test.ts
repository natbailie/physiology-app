import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { fetalLoopConfig } from './engine/loopConfig';
import { DEFAULT_FETAL_INPUTS, FETAL_PRESETS } from './engine/presets';
import { FETAL_QUESTIONS } from './questions';
import type { FetalDerived, FetalInputs, FetalState } from './engine/types';
import type { FetalPresetName } from './engine/presets';

type Snapshot = { state: FetalState; derived: FetalDerived };

const patterns = FETAL_QUESTIONS.filter(isPatternQuestion);
const predictions = FETAL_QUESTIONS.filter(
  (q): q is PredictQuestion<FetalInputs, FetalPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('fetal circulation pattern questions', () => {
  describePatternSet(fetalLoopConfig, DEFAULT_FETAL_INPUTS, FETAL_PRESETS, patterns);
});

describe('fetal circulation predict questions', () => {
  describeQuestionSet(fetalLoopConfig, DEFAULT_FETAL_INPUTS, FETAL_PRESETS, predictions);
});
