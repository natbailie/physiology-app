import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { inflammationLoopConfig } from './engine/loopConfig';
import { INFLAMMATION_PRESETS, DEFAULT_INFLAMMATION_INPUTS } from './engine/presets';
import { INFLAMMATION_QUESTIONS } from './questions';
import type { InflammationDerived, InflammationInputs, InflammationInternalState } from './engine/types';
import type { InflammationPresetName } from './engine/presets';

type Snapshot = { state: InflammationInternalState; derived: InflammationDerived };

const patterns = INFLAMMATION_QUESTIONS.filter(isPatternQuestion);
const predictions = INFLAMMATION_QUESTIONS.filter(
  (q): q is PredictQuestion<InflammationInputs, InflammationPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('inflammation pattern questions', () => {
  describePatternSet(inflammationLoopConfig, DEFAULT_INFLAMMATION_INPUTS, INFLAMMATION_PRESETS, patterns);
});
describe('inflammation predict questions', () => {
  describeQuestionSet(inflammationLoopConfig, DEFAULT_INFLAMMATION_INPUTS, INFLAMMATION_PRESETS, predictions);
});
