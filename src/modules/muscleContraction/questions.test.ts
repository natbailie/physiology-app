import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { muscleLoopConfig } from './engine/loopConfig';
import { DEFAULT_MUSCLE_INPUTS, MUSCLE_PRESETS } from './engine/presets';
import { MUSCLE_QUESTIONS } from './questions';

describe('muscleContraction practice questions', () => {
  describeQuestionSet(muscleLoopConfig, DEFAULT_MUSCLE_INPUTS, MUSCLE_PRESETS, MUSCLE_QUESTIONS);
});
