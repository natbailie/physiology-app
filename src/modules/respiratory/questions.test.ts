import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { respiratoryLoopConfig } from './engine/loopConfig';
import { DEFAULT_RESP_INPUTS, RESP_PRESETS } from './engine/presets';
import { RESPIRATORY_QUESTIONS } from './questions';

describe('respiratory practice questions', () => {
  describeQuestionSet(respiratoryLoopConfig, DEFAULT_RESP_INPUTS, RESP_PRESETS, RESPIRATORY_QUESTIONS);
});
