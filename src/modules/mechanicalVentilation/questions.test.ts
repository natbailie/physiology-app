import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { mvLoopConfig } from './engine/loopConfig';
import { DEFAULT_MV_INPUTS, MV_PRESETS } from './engine/presets';
import { MV_QUESTIONS } from './questions';

describe('mechanicalVentilation practice questions', () => {
  describeQuestionSet(mvLoopConfig, DEFAULT_MV_INPUTS, MV_PRESETS, MV_QUESTIONS);
});