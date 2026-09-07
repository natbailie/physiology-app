import { DEFAULT_RF_INPUTS } from './constants';
import type { RfInputs } from './types';
import { computeDerived, createInitialState } from './engine';

export { DEFAULT_RF_INPUTS };

export type RfPresetName = keyof typeof RF_PRESETS;

export const RF_PRESETS: Record<string, Partial<RfInputs>> = {
  normal: {
    fiO2: 0.21,
    minuteVentilation: 6,
    shuntFraction: 0.02,
    co2ProductionMultiplier: 1,
    course: 'acute',
  },
  type1Pneumonia: {
    fiO2: 0.21,
    minuteVentilation: 6,
    shuntFraction: 0.28,
    co2ProductionMultiplier: 1,
    course: 'acute',
  },
  type1Ards: {
    fiO2: 0.6,
    minuteVentilation: 7,
    shuntFraction: 0.5,
    co2ProductionMultiplier: 1,
    course: 'acute',
  },
  type2CopdExacerbation: {
    fiO2: 0.28,
    minuteVentilation: 4,
    shuntFraction: 0.1,
    co2ProductionMultiplier: 1.1,
    course: 'chronic',
  },
  type2ChronicCopd: {
    fiO2: 0.21,
    minuteVentilation: 4.2,
    shuntFraction: 0.08,
    co2ProductionMultiplier: 1.1,
    course: 'chronic',
  },
  type2Neuromuscular: {
    fiO2: 0.5,
    minuteVentilation: 3.5,
    shuntFraction: 0.02,
    co2ProductionMultiplier: 1,
    course: 'acute',
  },
  mixedSevere: {
    fiO2: 0.35,
    minuteVentilation: 3.5,
    shuntFraction: 0.45,
    co2ProductionMultiplier: 1.2,
    course: 'acute',
  },
};

export const RF_PRESET_LABELS: Record<string, string> = {
  normal: 'Normal',
  type1Pneumonia: 'Type I — pneumonia',
  type1Ards: 'Type I — ARDS',
  type2CopdExacerbation: 'Type II — COPD exacerbation',
  type2ChronicCopd: 'Type II — chronic COPD',
  type2Neuromuscular: 'Type II — neuromuscular',
  mixedSevere: 'Mixed failure',
};

export const PRESET_ORDER = [
  'normal',
  'type1Pneumonia',
  'type1Ards',
  'type2CopdExacerbation',
  'type2ChronicCopd',
  'type2Neuromuscular',
  'mixedSevere',
];

export function settlePreset(id: string): RfSnapshotEq {
  const inputs = { ...DEFAULT_RF_INPUTS, ...RF_PRESETS[id] };
  return { inputs, derived: computeDerived(createInitialState(), inputs) };
}

/** Returned by settlePreset — a plain value the test can assert against. */
export interface RfSnapshotEq {
  inputs: RfInputs;
  derived: ReturnType<typeof computeDerived>;
}