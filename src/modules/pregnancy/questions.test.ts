import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { pregnancyLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_PREGNANCY_INPUTS,
  PREGNANCY_PRESETS,
  type PregnancyPresetName,
} from './engine/presets';
import { PREGNANCY_QUESTIONS } from './questions';
import type { PregnancyDerived, PregnancyInputs, PregnancyInternalState } from './engine/types';

type Snapshot = { state: PregnancyInternalState; derived: PregnancyDerived };

const patterns = PREGNANCY_QUESTIONS.filter(isPatternQuestion);
const predictions = PREGNANCY_QUESTIONS.filter(
  (q): q is PredictQuestion<PregnancyInputs, PregnancyPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('pregnancy pattern questions', () => {
  describePatternSet(pregnancyLoopConfig, DEFAULT_PREGNANCY_INPUTS, PREGNANCY_PRESETS, patterns);
});

describe('pregnancy predict questions', () => {
  describeQuestionSet(pregnancyLoopConfig, DEFAULT_PREGNANCY_INPUTS, PREGNANCY_PRESETS, predictions);
});
