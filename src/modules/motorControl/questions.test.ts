import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { motorLoopConfig } from './engine/loopConfig';
import { DEFAULT_MOTOR_INPUTS, MOTOR_PRESETS, type MotorPresetName } from './engine/presets';
import { MOTOR_QUESTIONS } from './questions';
import type { MotorDerived, MotorInputs, MotorInternalState } from './engine/types';

type Snapshot = { state: MotorInternalState; derived: MotorDerived };

const patterns = MOTOR_QUESTIONS.filter(isPatternQuestion);
const predictions = MOTOR_QUESTIONS.filter(
  (q): q is PredictQuestion<MotorInputs, MotorPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('motor pattern questions', () => {
  describePatternSet(motorLoopConfig, DEFAULT_MOTOR_INPUTS, MOTOR_PRESETS, patterns);
});

describe('motor predict questions', () => {
  describeQuestionSet(motorLoopConfig, DEFAULT_MOTOR_INPUTS, MOTOR_PRESETS, predictions);
});
