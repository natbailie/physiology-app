import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { metabolismLoopConfig } from './engine/loopConfig';
import { DEFAULT_METABOLISM_INPUTS, METABOLISM_PRESETS, type MetabolismPresetName } from './engine/presets';
import { METABOLISM_QUESTIONS } from './questions';
import type { MetabolismDerived, MetabolismInputs, MetabolismInternalState } from './engine/types';

type Snapshot = { state: MetabolismInternalState; derived: MetabolismDerived };

const patterns = METABOLISM_QUESTIONS.filter(isPatternQuestion);
const predictions = METABOLISM_QUESTIONS.filter(
  (q): q is PredictQuestion<MetabolismInputs, MetabolismPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('metabolism pattern questions', () => {
  describePatternSet(metabolismLoopConfig, DEFAULT_METABOLISM_INPUTS, METABOLISM_PRESETS, patterns);
});

describe('metabolism predict questions', () => {
  describeQuestionSet(metabolismLoopConfig, DEFAULT_METABOLISM_INPUTS, METABOLISM_PRESETS, predictions);
});