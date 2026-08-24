import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { adrenalLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_ADRENAL_INPUTS,
  ADRENAL_PRESETS,
  type AdrenalCortexPresetName,
} from './engine/presets';
import { ADRENAL_QUESTIONS } from './questions';
import type { AdrenalCortexDerived, AdrenalCortexInputs, AdrenalCortexInternalState } from './engine/types';

type Snapshot = { state: AdrenalCortexInternalState; derived: AdrenalCortexDerived };

const patterns = ADRENAL_QUESTIONS.filter(isPatternQuestion);
const predictions = ADRENAL_QUESTIONS.filter(
  (q): q is PredictQuestion<AdrenalCortexInputs, AdrenalCortexPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('adrenal cortex pattern questions', () => {
  describePatternSet(adrenalLoopConfig, DEFAULT_ADRENAL_INPUTS, ADRENAL_PRESETS, patterns);
});

describe('adrenal cortex predict questions', () => {
  describeQuestionSet(adrenalLoopConfig, DEFAULT_ADRENAL_INPUTS, ADRENAL_PRESETS, predictions);
});
