import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { digestionLoopConfig } from './engine/loopConfig';
import { DIGESTION_PRESETS, DEFAULT_DIGESTION_INPUTS } from './engine/presets';
import { DIGESTION_QUESTIONS } from './questions';
import type { DigestionDerived, DigestionInputs, DigestionInternalState } from './engine/types';
import type { DigestionPresetName } from './engine/presets';

type Snapshot = { state: DigestionInternalState; derived: DigestionDerived };

const patterns = DIGESTION_QUESTIONS.filter(isPatternQuestion);
const predictions = DIGESTION_QUESTIONS.filter(
  (q): q is PredictQuestion<DigestionInputs, DigestionPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('digestion pattern questions', () => {
  describePatternSet(digestionLoopConfig, DEFAULT_DIGESTION_INPUTS, DIGESTION_PRESETS, patterns);
});

describe('digestion predict questions', () => {
  describeQuestionSet(digestionLoopConfig, DEFAULT_DIGESTION_INPUTS, DIGESTION_PRESETS, predictions);
});
