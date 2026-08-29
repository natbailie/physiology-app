import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { cellCycleLoopConfig } from './engine/loopConfig';
import { DEFAULT_CELL_CYCLE_INPUTS, CELL_CYCLE_PRESETS, type CellCyclePresetName } from './engine/presets';
import { CELL_CYCLE_QUESTIONS } from './questions';
import type { CellCycleDerived, CellCycleInputs, CellCycleInternalState } from './engine/types';

type Snapshot = { state: CellCycleInternalState; derived: CellCycleDerived };

const patterns = CELL_CYCLE_QUESTIONS.filter(isPatternQuestion);
const predictions = CELL_CYCLE_QUESTIONS.filter(
  (q): q is PredictQuestion<CellCycleInputs, CellCyclePresetName, Snapshot> => !isPatternQuestion(q),
);

describe('cellCycle pattern questions', () => {
  describePatternSet(cellCycleLoopConfig, DEFAULT_CELL_CYCLE_INPUTS, CELL_CYCLE_PRESETS, patterns);
});

describe('cellCycle predict questions', () => {
  describeQuestionSet(cellCycleLoopConfig, DEFAULT_CELL_CYCLE_INPUTS, CELL_CYCLE_PRESETS, predictions);
});
