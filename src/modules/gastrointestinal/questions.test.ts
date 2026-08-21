import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { giLoopConfig } from './engine/loopConfig';
import { DEFAULT_GI_INPUTS, GI_PRESETS } from './engine/presets';
import { GI_QUESTIONS } from './questions';

describe('gastrointestinal practice questions', () => {
  describeQuestionSet(giLoopConfig, DEFAULT_GI_INPUTS, GI_PRESETS, GI_QUESTIONS);
});
