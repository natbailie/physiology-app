import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { vestibularLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_VESTIBULAR_INPUTS,
  VESTIBULAR_PRESETS,
  type VestibularPresetName,
} from './engine/presets';
import { VESTIBULAR_QUESTIONS } from './questions';
import type { VestibularDerived, VestibularInputs, VestibularInternalState } from './engine/types';

type Snapshot = { state: VestibularInternalState; derived: VestibularDerived };

const patterns = VESTIBULAR_QUESTIONS.filter(isPatternQuestion);
const predictions = VESTIBULAR_QUESTIONS.filter(
  (q): q is PredictQuestion<VestibularInputs, VestibularPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('vestibular pattern questions', () => {
  describePatternSet(vestibularLoopConfig, DEFAULT_VESTIBULAR_INPUTS, VESTIBULAR_PRESETS, patterns);
});

describe('vestibular predict questions', () => {
  describeQuestionSet(vestibularLoopConfig, DEFAULT_VESTIBULAR_INPUTS, VESTIBULAR_PRESETS, predictions);
});
