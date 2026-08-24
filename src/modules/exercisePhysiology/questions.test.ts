import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { exerciseLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_EXERCISE_INPUTS,
  EXERCISE_PRESETS,
  type ExercisePresetName,
} from './engine/presets';
import { EXERCISE_QUESTIONS } from './questions';
import type {
  ExerciseDerived,
  ExerciseInputs,
  ExerciseInternalState,
} from './engine/types';

type Snapshot = { state: ExerciseInternalState; derived: ExerciseDerived };

const patterns = EXERCISE_QUESTIONS.filter(isPatternQuestion);
const predictions = EXERCISE_QUESTIONS.filter(
  (q): q is PredictQuestion<ExerciseInputs, ExercisePresetName, Snapshot> => !isPatternQuestion(q),
);

describe('exercise pattern questions', () => {
  describePatternSet(exerciseLoopConfig, DEFAULT_EXERCISE_INPUTS, EXERCISE_PRESETS, patterns);
});

describe('exercise predict questions', () => {
  describeQuestionSet(exerciseLoopConfig, DEFAULT_EXERCISE_INPUTS, EXERCISE_PRESETS, predictions);
});
