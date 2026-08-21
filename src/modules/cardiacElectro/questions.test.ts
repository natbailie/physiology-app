import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { cardiacLoopConfig } from './engine/loopConfig';
import { DEFAULT_CARDIAC_INPUTS, CARDIAC_PRESETS } from './engine/presets';
import { CARDIAC_QUESTIONS } from './questions';

describe('cardiacElectro practice questions', () => {
  describeQuestionSet(cardiacLoopConfig, DEFAULT_CARDIAC_INPUTS, CARDIAC_PRESETS, CARDIAC_QUESTIONS);
});
