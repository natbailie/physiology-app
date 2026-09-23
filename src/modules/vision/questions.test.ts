import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { describeGlossSet } from '@/shared/assessment/glossSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { visionLoopConfig } from './engine/loopConfig';
import { DEFAULT_VISION_INPUTS, VISION_PRESETS, type VisionPresetName, VISION_PRESET_GLOSS } from './engine/presets';
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

describeGlossSet(VISION_PRESET_GLOSS, VISION_PRESETS, patterns);
