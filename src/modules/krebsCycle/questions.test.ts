import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { describeGlossSet } from '@/shared/assessment/glossSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { krebsCycleLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_KREBS_CYCLE_INPUTS,
  KREBS_CYCLE_PRESETS,
  KREBS_CYCLE_PRESET_GLOSS,
  type KrebsCyclePresetName,
} from './engine/presets';
import { KREBS_CYCLE_QUESTIONS } from './questions';
import type { KrebsCycleDerived, KrebsCycleInputs, KrebsCycleInternalState } from './engine/types';

type Snapshot = { state: KrebsCycleInternalState; derived: KrebsCycleDerived };

const patterns = KREBS_CYCLE_QUESTIONS.filter(isPatternQuestion);
const predictions = KREBS_CYCLE_QUESTIONS.filter(
  (q): q is PredictQuestion<KrebsCycleInputs, KrebsCyclePresetName, Snapshot> => !isPatternQuestion(q),
);

describe('krebsCycle pattern questions', () => {
  describePatternSet(krebsCycleLoopConfig, DEFAULT_KREBS_CYCLE_INPUTS, KREBS_CYCLE_PRESETS, patterns);
});

describe('krebsCycle predict questions', () => {
  describeQuestionSet(krebsCycleLoopConfig, DEFAULT_KREBS_CYCLE_INPUTS, KREBS_CYCLE_PRESETS, predictions);
});

describe('krebsCycle option glosses', () => {
  describeGlossSet(KREBS_CYCLE_PRESET_GLOSS, KREBS_CYCLE_PRESETS, patterns);
});
