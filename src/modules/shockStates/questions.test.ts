import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { describeGlossSet } from '@/shared/assessment/glossSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { shockLoopConfig } from './engine/loopConfig';
import { DEFAULT_SHOCK_INPUTS, SHOCK_PRESETS, SHOCK_PRESET_GLOSS } from './engine/presets';
import { SHOCK_QUESTIONS } from './questions';
import type { ShockDerived, ShockInputs, ShockState } from './engine/types';
import type { ShockPresetName } from './engine/presets';

type Snapshot = { state: ShockState; derived: ShockDerived };

// The first module to carry both formats: the four states are a pattern-discrimination problem,
// and what happens when you treat the wrong one is a prediction.
const patterns = SHOCK_QUESTIONS.filter(isPatternQuestion);
const predictions = SHOCK_QUESTIONS.filter(
  (q): q is PredictQuestion<ShockInputs, ShockPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('shock pattern questions', () => {
  describePatternSet(shockLoopConfig, DEFAULT_SHOCK_INPUTS, SHOCK_PRESETS, patterns);
});

describe('shock predict questions', () => {
  describeQuestionSet(shockLoopConfig, DEFAULT_SHOCK_INPUTS, SHOCK_PRESETS, predictions);
});

describeGlossSet(SHOCK_PRESET_GLOSS, SHOCK_PRESETS, patterns);
