import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { coagLoopConfig } from './engine/loopConfig';
import { DEFAULT_COAG_INPUTS, COAG_PRESETS } from './engine/presets';
import { COAGULATION_QUESTIONS } from './questions';

describe('coagulation pattern questions', () => {
  describePatternSet(coagLoopConfig, DEFAULT_COAG_INPUTS, COAG_PRESETS, COAGULATION_QUESTIONS);
});
