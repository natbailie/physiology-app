import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { cardiorenalLoopConfig } from './engine/loopConfig';
import { DEFAULT_INPUTS, PRESETS } from './engine/presets';
import { CARDIORENAL_QUESTIONS } from './questions';

describe('cardiorenal practice questions', () => {
  describeQuestionSet(cardiorenalLoopConfig, DEFAULT_INPUTS, PRESETS, CARDIORENAL_QUESTIONS);
});
