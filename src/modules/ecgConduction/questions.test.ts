import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { ecgLoopConfig } from './engine/loopConfig';
import { DEFAULT_ECG_INPUTS, ECG_PRESETS } from './engine/presets';
import { ECG_QUESTIONS } from './questions';
import type { EcgDerived, EcgInputs, EcgState } from './engine/types';
import type { EcgPresetName } from './engine/presets';

type Snapshot = { state: EcgState; derived: EcgDerived };

// Localising an infarct is a pattern-discrimination problem — no single lead names the
// territory, the combination across leads does — while what a conduction change DOES to the
// complex is a prediction.
const patterns = ECG_QUESTIONS.filter(isPatternQuestion);
const predictions = ECG_QUESTIONS.filter(
  (q): q is PredictQuestion<EcgInputs, EcgPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('ecgConduction pattern questions', () => {
  describePatternSet(ecgLoopConfig, DEFAULT_ECG_INPUTS, ECG_PRESETS, patterns);
});

describe('ecgConduction predict questions', () => {
  describeQuestionSet(ecgLoopConfig, DEFAULT_ECG_INPUTS, ECG_PRESETS, predictions);
});
