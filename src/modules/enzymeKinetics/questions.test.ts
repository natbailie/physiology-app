import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { kineticsLoopConfig } from './engine/loopConfig';
import { DEFAULT_KINETICS_INPUTS, KINETICS_PRESETS, type KineticsPresetName } from './engine/presets';
import { KINETICS_QUESTIONS } from './questions';
import type { KineticsDerived, KineticsInputs, KineticsInternalState } from './engine/types';

type Snapshot = { state: KineticsInternalState; derived: KineticsDerived };

const patterns = KINETICS_QUESTIONS.filter(isPatternQuestion);
const predictions = KINETICS_QUESTIONS.filter(
  (q): q is PredictQuestion<KineticsInputs, KineticsPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('enzymeKinetics pattern questions', () => {
  describePatternSet(kineticsLoopConfig, DEFAULT_KINETICS_INPUTS, KINETICS_PRESETS, patterns);
});

describe('enzymeKinetics predict questions', () => {
  describeQuestionSet(kineticsLoopConfig, DEFAULT_KINETICS_INPUTS, KINETICS_PRESETS, predictions);
});
