import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { glucoseLoopConfig } from './engine/loopConfig';
import { DEFAULT_GLUCOSE_INPUTS, GLUCOSE_PRESETS } from './engine/presets';
import { GLUCOSE_QUESTIONS } from './questions';

describe('glucoseRegulation practice questions', () => {
  describeQuestionSet(glucoseLoopConfig, DEFAULT_GLUCOSE_INPUTS, GLUCOSE_PRESETS, GLUCOSE_QUESTIONS);
});
