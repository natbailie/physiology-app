import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { capillaryLoopConfig } from './engine/loopConfig';
import { DEFAULT_CAPILLARY_INPUTS, CAPILLARY_PRESETS } from './engine/presets';
import { CAPILLARY_QUESTIONS } from './questions';

describe('capillaryExchange practice questions', () => {
  describeQuestionSet(capillaryLoopConfig, DEFAULT_CAPILLARY_INPUTS, CAPILLARY_PRESETS, CAPILLARY_QUESTIONS);
});
