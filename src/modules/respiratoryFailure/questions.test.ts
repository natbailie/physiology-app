import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { respiratoryFailureLoopConfig } from './engine/loopConfig';
import { DEFAULT_RF_INPUTS, RF_PRESETS } from './engine/presets';
import { RF_QUESTIONS } from './questions';

describe('respiratoryFailure practice questions', () => {
  describeQuestionSet(respiratoryFailureLoopConfig, DEFAULT_RF_INPUTS, RF_PRESETS, RF_QUESTIONS);
});