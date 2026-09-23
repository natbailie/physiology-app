import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { cognitiveNeuroscienceLoopConfig } from './engine/loopConfig';
import { DEFAULT_COGNITION_INPUTS, COGNITION_PRESETS, type CognitionPresetName } from './engine/presets';
import { COGNITION_QUESTIONS } from './questions';
import type { CognitionDerived, CognitionInputs, CognitionInternalState } from './engine/types';

type Snapshot = { state: CognitionInternalState; derived: CognitionDerived };

const patterns = COGNITION_QUESTIONS.filter(isPatternQuestion);
const predictions = COGNITION_QUESTIONS.filter(
  (q): q is PredictQuestion<CognitionInputs, CognitionPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('cognitive neuroscience pattern questions', () => {
  describePatternSet(cognitiveNeuroscienceLoopConfig, DEFAULT_COGNITION_INPUTS, COGNITION_PRESETS, patterns);
});

describe('cognitive neuroscience predict questions', () => {
  describeQuestionSet(cognitiveNeuroscienceLoopConfig, DEFAULT_COGNITION_INPUTS, COGNITION_PRESETS, predictions);
});