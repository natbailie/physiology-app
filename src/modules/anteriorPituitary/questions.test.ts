import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { pituitaryLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_PITUITARY_INPUTS,
  PITUITARY_PRESETS,
  type PituitaryPresetName,
} from './engine/presets';
import { PITUITARY_QUESTIONS } from './questions';
import type { PituitaryDerived, PituitaryInputs, PituitaryInternalState } from './engine/types';

type Snapshot = { state: PituitaryInternalState; derived: PituitaryDerived };

const patterns = PITUITARY_QUESTIONS.filter(isPatternQuestion);
const predictions = PITUITARY_QUESTIONS.filter(
  (q): q is PredictQuestion<PituitaryInputs, PituitaryPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('pituitary pattern questions', () => {
  describePatternSet(pituitaryLoopConfig, DEFAULT_PITUITARY_INPUTS, PITUITARY_PRESETS, patterns);
});

describe('pituitary predict questions', () => {
  describeQuestionSet(pituitaryLoopConfig, DEFAULT_PITUITARY_INPUTS, PITUITARY_PRESETS, predictions);
});
