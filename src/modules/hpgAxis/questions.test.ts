import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { hpgLoopConfig } from './engine/loopConfig';
import { DEFAULT_HPG_INPUTS, HPG_PRESETS } from './engine/presets';
import { HPG_QUESTIONS } from './questions';

describe('hpgAxis practice questions', () => {
  describeQuestionSet(hpgLoopConfig, DEFAULT_HPG_INPUTS, HPG_PRESETS, HPG_QUESTIONS);
});
