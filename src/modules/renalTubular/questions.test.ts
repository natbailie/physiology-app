import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { renalTubularLoopConfig } from './engine/loopConfig';
import { DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS } from './engine/presets';
import { RENAL_TUBULAR_QUESTIONS } from './questions';

describe('renalTubular practice questions', () => {
  describeQuestionSet(renalTubularLoopConfig, DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS, RENAL_TUBULAR_QUESTIONS);
});
