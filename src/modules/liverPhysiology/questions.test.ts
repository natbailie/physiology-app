import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { liverLoopConfig } from './engine/loopConfig';
import { DEFAULT_LIVER_INPUTS, LIVER_PRESETS, type LiverPresetName } from './engine/presets';
import { LIVER_QUESTIONS } from './questions';
import type { LiverDerived, LiverInputs, LiverInternalState } from './engine/types';

type Snapshot = { state: LiverInternalState; derived: LiverDerived };

const patterns = LIVER_QUESTIONS.filter(isPatternQuestion);
const predictions = LIVER_QUESTIONS.filter(
  (q): q is PredictQuestion<LiverInputs, LiverPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('liver pattern questions', () => {
  describePatternSet(liverLoopConfig, DEFAULT_LIVER_INPUTS, LIVER_PRESETS, patterns);
});

describe('liver predict questions', () => {
  describeQuestionSet(liverLoopConfig, DEFAULT_LIVER_INPUTS, LIVER_PRESETS, predictions);
});
