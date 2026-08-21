import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { immuneLoopConfig } from './engine/loopConfig';
import { DEFAULT_IMMUNE_INPUTS, IMMUNE_PRESETS } from './engine/presets';
import { IMMUNE_QUESTIONS } from './questions';

describe('immuneResponse practice questions', () => {
  describeQuestionSet(immuneLoopConfig, DEFAULT_IMMUNE_INPUTS, IMMUNE_PRESETS, IMMUNE_QUESTIONS);
});
