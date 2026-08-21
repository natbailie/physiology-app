import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { membraneLoopConfig } from './engine/loopConfig';
import { DEFAULT_MEMBRANE_INPUTS, MEMBRANE_PRESETS } from './engine/presets';
import { MEMBRANE_QUESTIONS } from './questions';

describe('membranePotentials practice questions', () => {
  describeQuestionSet(membraneLoopConfig, DEFAULT_MEMBRANE_INPUTS, MEMBRANE_PRESETS, MEMBRANE_QUESTIONS);
});
