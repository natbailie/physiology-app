import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { somaticLoopConfig } from './engine/loopConfig';
import { DEFAULT_SOMATIC_INPUTS, SOMATIC_PRESETS, type SomaticPresetName } from './engine/presets';
import { SOMATIC_QUESTIONS } from './questions';
import type { SomaticDerived, SomaticInputs, SomaticInternalState } from './engine/types';

type Snapshot = { state: SomaticInternalState; derived: SomaticDerived };

const patterns = SOMATIC_QUESTIONS.filter(isPatternQuestion);
const predictions = SOMATIC_QUESTIONS.filter(
  (q): q is PredictQuestion<SomaticInputs, SomaticPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('somatic pattern questions', () => {
  describePatternSet(somaticLoopConfig, DEFAULT_SOMATIC_INPUTS, SOMATIC_PRESETS, patterns);
});

describe('somatic predict questions', () => {
  describeQuestionSet(somaticLoopConfig, DEFAULT_SOMATIC_INPUTS, SOMATIC_PRESETS, predictions);
});
