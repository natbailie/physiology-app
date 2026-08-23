import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { visionLoopConfig } from './engine/loopConfig';
import { DEFAULT_VISION_INPUTS, VISION_PRESETS, type VisionPresetName } from './engine/presets';
import { VISION_QUESTIONS } from './questions';
import type { VisionDerived, VisionInputs, VisionInternalState } from './engine/types';

type Snapshot = { state: VisionInternalState; derived: VisionDerived };

const patterns = VISION_QUESTIONS.filter(isPatternQuestion);
const predictions = VISION_QUESTIONS.filter(
  (q): q is PredictQuestion<VisionInputs, VisionPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('vision pattern questions', () => {
  describePatternSet(visionLoopConfig, DEFAULT_VISION_INPUTS, VISION_PRESETS, patterns);
});

describe('vision predict questions', () => {
  describeQuestionSet(visionLoopConfig, DEFAULT_VISION_INPUTS, VISION_PRESETS, predictions);
});
