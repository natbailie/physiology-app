import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { hpaLoopConfig } from './engine/loopConfig';
import { DEFAULT_HPA_INPUTS, HPA_PRESETS } from './engine/presets';
import { HPA_QUESTIONS } from './questions';

describe('hpaAxis practice questions', () => {
  describeQuestionSet(hpaLoopConfig, DEFAULT_HPA_INPUTS, HPA_PRESETS, HPA_QUESTIONS);
});
