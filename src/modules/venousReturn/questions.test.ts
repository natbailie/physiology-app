import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { venousReturnLoopConfig } from './engine/loopConfig';
import { DEFAULT_VENOUS_RETURN_INPUTS, VENOUS_RETURN_PRESETS } from './engine/presets';
import { VENOUS_RETURN_QUESTIONS } from './questions';

describe('venousReturn practice questions', () => {
  describeQuestionSet(venousReturnLoopConfig, DEFAULT_VENOUS_RETURN_INPUTS, VENOUS_RETURN_PRESETS, VENOUS_RETURN_QUESTIONS);
});
