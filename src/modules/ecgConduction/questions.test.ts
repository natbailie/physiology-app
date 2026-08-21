import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { ecgLoopConfig } from './engine/loopConfig';
import { DEFAULT_ECG_INPUTS, ECG_PRESETS } from './engine/presets';
import { ECG_QUESTIONS } from './questions';

describe('ecgConduction practice questions', () => {
  describeQuestionSet(ecgLoopConfig, DEFAULT_ECG_INPUTS, ECG_PRESETS, ECG_QUESTIONS);
});
