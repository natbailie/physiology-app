import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { calciumLoopConfig } from './engine/loopConfig';
import { DEFAULT_CALCIUM_INPUTS, CALCIUM_PRESETS } from './engine/presets';
import { CALCIUM_QUESTIONS } from './questions';

describe('calciumHomeostasis practice questions', () => {
  describeQuestionSet(calciumLoopConfig, DEFAULT_CALCIUM_INPUTS, CALCIUM_PRESETS, CALCIUM_QUESTIONS);
});
