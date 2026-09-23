import type { MetabolismInputs } from './types';

export const DEFAULT_METABOLISM_INPUTS: MetabolismInputs = {
  hoursPostAbsorptive: 8,
  insulinResistance: 1,
  injuryStress: 0,
  basalMetabolicRate: 2000,
  activityMet: 1,
  carbohydrateIntake: 250,
  fatIntake: 70,
  proteinIntake: 60,
};

export type MetabolismPresetName =
  | 'normal'
  | 'fed'
  | 'fasted24'
  | 'starvation'
  | 'type2Diabetes'
  | 'ituCatabolic'
  | 'enduranceAthlete';

export const METABOLISM_PRESETS: Record<MetabolismPresetName, Partial<MetabolismInputs>> = {
  normal: { ...DEFAULT_METABOLISM_INPUTS },
  // Two hours since a mixed meal: insulin high, carbohydrate burning, glucose near its peak.
  fed: { ...DEFAULT_METABOLISM_INPUTS, hoursPostAbsorptive: 2, carbohydrateIntake: 300 },
  // Twenty-four hours without food: glycogen is spent, the mix has tipped to fat, ketones start.
  fasted24: { ...DEFAULT_METABOLISM_INPUTS, hoursPostAbsorptive: 24 },
  // Sixty hours: deep starvation, gluconeogenesis defending the floor, frank ketosis.
  starvation: { ...DEFAULT_METABOLISM_INPUTS, hoursPostAbsorptive: 60, carbohydrateIntake: 50 },
  // Insulin resistance: glucose runs high, the carb burn is blunted and ketosis is suppressed.
  type2Diabetes: {
    ...DEFAULT_METABOLISM_INPUTS,
    hoursPostAbsorptive: 12,
    insulinResistance: 2.2,
    carbohydrateIntake: 200,
    fatIntake: 80,
  },
  // Trauma/ITU: the cortisol-catecholamine response raises the energy bill and burns protein.
  ituCatabolic: {
    ...DEFAULT_METABOLISM_INPUTS,
    hoursPostAbsorptive: 16,
    injuryStress: 0.8,
    basalMetabolicRate: 2200,
    proteinIntake: 140,
  },
  // An endurance athlete a few hours post-exercise: a raised resting bill, high carbohydrate
  // demand, and a higher BMR from the lean mass.
  enduranceAthlete: {
    ...DEFAULT_METABOLISM_INPUTS,
    hoursPostAbsorptive: 6,
    activityMet: 3,
    basalMetabolicRate: 2600,
    carbohydrateIntake: 400,
  },
};

export const METABOLISM_PRESET_LABELS: Record<MetabolismPresetName, string> = {
  normal: 'Normal (8h)',
  fed: 'Just fed',
  fasted24: '24h fast',
  starvation: 'Starvation',
  type2Diabetes: 'Type 2 diabetes',
  ituCatabolic: 'Trauma / ITU',
  enduranceAthlete: 'Endurance athlete',
};

export const METABOLISM_PRESET_ORDER: MetabolismPresetName[] = [
  'normal',
  'fed',
  'fasted24',
  'starvation',
  'type2Diabetes',
  'ituCatabolic',
  'enduranceAthlete',
];