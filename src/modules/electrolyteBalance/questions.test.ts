import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { electrolyteLoopConfig } from './engine/loopConfig';
import { DEFAULT_ELECTROLYTE_INPUTS, ELECTROLYTE_PRESETS } from './engine/presets';
import { ELECTROLYTE_QUESTIONS } from './questions';

describe('electrolyte practice questions', () => {
  describeQuestionSet(
    electrolyteLoopConfig,
    DEFAULT_ELECTROLYTE_INPUTS,
    ELECTROLYTE_PRESETS,
    ELECTROLYTE_QUESTIONS,
  );
});
