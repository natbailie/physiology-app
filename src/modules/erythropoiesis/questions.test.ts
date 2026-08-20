import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { erythroLoopConfig } from './engine/loopConfig';
import { DEFAULT_ERYTHRO_INPUTS, ERYTHRO_PRESETS } from './engine/presets';
import { ERYTHROPOIESIS_QUESTIONS } from './questions';

describe('erythropoiesis pattern questions', () => {
  describePatternSet(erythroLoopConfig, DEFAULT_ERYTHRO_INPUTS, ERYTHRO_PRESETS, ERYTHROPOIESIS_QUESTIONS);
});
