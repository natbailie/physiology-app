import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { hptLoopConfig } from './engine/loopConfig';
import { DEFAULT_HPT_INPUTS, HPT_PRESETS } from './engine/presets';
import { HPT_QUESTIONS } from './questions';

describe('hptAxis practice questions', () => {
  describeQuestionSet(hptLoopConfig, DEFAULT_HPT_INPUTS, HPT_PRESETS, HPT_QUESTIONS);
});
