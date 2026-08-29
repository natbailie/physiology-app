import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { coronaryLoopConfig } from './engine/loopConfig';
import { CORONARY_PRESETS, DEFAULT_CORONARY_INPUTS } from './engine/presets';
import { CORONARY_QUESTIONS } from './questions';
import type { CoronaryDerived, CoronaryInputs, CoronaryInternalState } from './engine/types';
import type { CoronaryPresetName } from './engine/presets';

type Snapshot = { state: CoronaryInternalState; derived: CoronaryDerived };

const patterns = CORONARY_QUESTIONS.filter(isPatternQuestion);
const predictions = CORONARY_QUESTIONS.filter(
  (q): q is PredictQuestion<CoronaryInputs, CoronaryPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('coronary pattern questions', () => {
  describePatternSet(coronaryLoopConfig, DEFAULT_CORONARY_INPUTS, CORONARY_PRESETS, patterns);
});

describe('coronary predict questions', () => {
  describeQuestionSet(coronaryLoopConfig, DEFAULT_CORONARY_INPUTS, CORONARY_PRESETS, predictions);
});
