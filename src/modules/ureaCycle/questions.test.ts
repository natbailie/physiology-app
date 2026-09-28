import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { describeGlossSet } from '@/shared/assessment/glossSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { ureaCycleLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_UREA_CYCLE_INPUTS,
  UREA_CYCLE_PRESETS,
  UREA_CYCLE_PRESET_GLOSS,
  type UreaCyclePresetName,
} from './engine/presets';
import { UREA_CYCLE_QUESTIONS } from './questions';
import type { UreaCycleDerived, UreaCycleInputs, UreaCycleInternalState } from './engine/types';

type Snapshot = { state: UreaCycleInternalState; derived: UreaCycleDerived };

const patterns = UREA_CYCLE_QUESTIONS.filter(isPatternQuestion);
const predictions = UREA_CYCLE_QUESTIONS.filter(
  (q): q is PredictQuestion<UreaCycleInputs, UreaCyclePresetName, Snapshot> => !isPatternQuestion(q),
);

describe('ureaCycle pattern questions', () => {
  describePatternSet(ureaCycleLoopConfig, DEFAULT_UREA_CYCLE_INPUTS, UREA_CYCLE_PRESETS, patterns);
});

describe('ureaCycle predict questions', () => {
  describeQuestionSet(ureaCycleLoopConfig, DEFAULT_UREA_CYCLE_INPUTS, UREA_CYCLE_PRESETS, predictions);
});

describe('ureaCycle option glosses', () => {
  describeGlossSet(UREA_CYCLE_PRESET_GLOSS, UREA_CYCLE_PRESETS, patterns);
});
