import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { bloodLoopConfig } from './engine/loopConfig';
import { DEFAULT_BLOOD_INPUTS, BLOOD_PRESETS, type BloodPresetName } from './engine/presets';
import { BLOOD_QUESTIONS } from './questions';
import type { BloodDerived, BloodInputs, BloodInternalState } from './engine/types';

type Snapshot = { state: BloodInternalState; derived: BloodDerived };

const patterns = BLOOD_QUESTIONS.filter(isPatternQuestion);
const predictions = BLOOD_QUESTIONS.filter(
  (q): q is PredictQuestion<BloodInputs, BloodPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('blood groups pattern questions', () => {
  describePatternSet(bloodLoopConfig, DEFAULT_BLOOD_INPUTS, BLOOD_PRESETS, patterns);
});

describe('blood groups predict questions', () => {
  describeQuestionSet(bloodLoopConfig, DEFAULT_BLOOD_INPUTS, BLOOD_PRESETS, predictions);
});
