import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { electrolyteLoopConfig } from './engine/loopConfig';
import { DEFAULT_ELECTROLYTE_INPUTS, ELECTROLYTE_PRESETS } from './engine/presets';
import { ELECTROLYTE_QUESTIONS } from './questions';
import type { ElectrolyteDerived, ElectrolyteInputs, ElectrolyteState } from './engine/types';
import type { ElectrolytePresetName } from './engine/presets';

type Snapshot = { state: ElectrolyteState; derived: ElectrolyteDerived };

// Working up a hyponatraemia is a pattern-discrimination problem — the serum sodium is nearly
// identical across the three causes, which is exactly why the algorithm exists.
const patterns = ELECTROLYTE_QUESTIONS.filter(isPatternQuestion);
const predictions = ELECTROLYTE_QUESTIONS.filter(
  (q): q is PredictQuestion<ElectrolyteInputs, ElectrolytePresetName, Snapshot> => !isPatternQuestion(q),
);

describe('electrolyte pattern questions', () => {
  describePatternSet(electrolyteLoopConfig, DEFAULT_ELECTROLYTE_INPUTS, ELECTROLYTE_PRESETS, patterns);
});

describe('electrolyte predict questions', () => {
  describeQuestionSet(electrolyteLoopConfig, DEFAULT_ELECTROLYTE_INPUTS, ELECTROLYTE_PRESETS, predictions);
});
