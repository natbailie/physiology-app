import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { ansLoopConfig } from './engine/loopConfig';
import { DEFAULT_ANS_INPUTS, ANS_PRESETS } from './engine/presets';
import { ANS_QUESTIONS } from './questions';

describe('autonomicNervous practice questions', () => {
  describeQuestionSet(ansLoopConfig, DEFAULT_ANS_INPUTS, ANS_PRESETS, ANS_QUESTIONS);
});
