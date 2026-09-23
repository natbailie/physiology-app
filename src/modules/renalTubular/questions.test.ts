import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { describeGlossSet } from '@/shared/assessment/glossSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { renalTubularLoopConfig } from './engine/loopConfig';
import { DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS, RENAL_TUBULAR_PRESET_GLOSS } from './engine/presets';
import { RENAL_TUBULAR_QUESTIONS } from './questions';
import type { RenalTubularDerived, RenalTubularInputs, RenalTubularState } from './engine/types';
import type { RenalTubularPresetName } from './engine/presets';

type Snapshot = { state: RenalTubularState; derived: RenalTubularDerived };

// The RTAs and the AKIs are pattern-discrimination problems — that is how they are examined
// and how they present. What a drug or hormone DOES to the tubule is a prediction.
const patterns = RENAL_TUBULAR_QUESTIONS.filter(isPatternQuestion);
const predictions = RENAL_TUBULAR_QUESTIONS.filter(
  (q): q is PredictQuestion<RenalTubularInputs, RenalTubularPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('renalTubular pattern questions', () => {
  describePatternSet(renalTubularLoopConfig, DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS, patterns);
});

describe('renalTubular predict questions', () => {
  describeQuestionSet(renalTubularLoopConfig, DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS, predictions);
});

describeGlossSet(RENAL_TUBULAR_PRESET_GLOSS, RENAL_TUBULAR_PRESETS, patterns);
