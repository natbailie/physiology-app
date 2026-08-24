import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { thermoLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_THERMO_INPUTS,
  THERMO_PRESETS,
  type ThermoPresetName,
} from './engine/presets';
import { THERMO_QUESTIONS } from './questions';
import type { ThermoDerived, ThermoInputs, ThermoInternalState } from './engine/types';

type Snapshot = { state: ThermoInternalState; derived: ThermoDerived };

const patterns = THERMO_QUESTIONS.filter(isPatternQuestion);
const predictions = THERMO_QUESTIONS.filter(
  (q): q is PredictQuestion<ThermoInputs, ThermoPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('thermoregulation pattern questions', () => {
  describePatternSet(thermoLoopConfig, DEFAULT_THERMO_INPUTS, THERMO_PRESETS, patterns);
});

describe('thermoregulation predict questions', () => {
  describeQuestionSet(thermoLoopConfig, DEFAULT_THERMO_INPUTS, THERMO_PRESETS, predictions);
});
