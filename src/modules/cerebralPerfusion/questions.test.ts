import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { cerebralLoopConfig } from './engine/loopConfig';
import { CEREBRAL_PRESETS, DEFAULT_CEREBRAL_INPUTS } from './engine/presets';
import { CEREBRAL_QUESTIONS } from './questions';
import type { CerebralDerived, CerebralInputs, CerebralInternalState } from './engine/types';
import type { CerebralPresetName } from './engine/presets';

type Snapshot = { state: CerebralInternalState; derived: CerebralDerived };

const patterns = CEREBRAL_QUESTIONS.filter(isPatternQuestion);
const predictions = CEREBRAL_QUESTIONS.filter(
  (q): q is PredictQuestion<CerebralInputs, CerebralPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('cerebral pattern questions', () => {
  describePatternSet(cerebralLoopConfig, DEFAULT_CEREBRAL_INPUTS, CEREBRAL_PRESETS, patterns);
});

describe('cerebral predict questions', () => {
  describeQuestionSet(cerebralLoopConfig, DEFAULT_CEREBRAL_INPUTS, CEREBRAL_PRESETS, predictions);
});
