import type { ThermoInputs } from './types';

export const DEFAULT_THERMO_INPUTS: ThermoInputs = {
  ambientTemperatureC: 21,
  humidityPct: 45,
  metabolicRateMultiplier: 1,
  windWetnessPct: 0,
  pyrogenLevel: 0,
  sweatImpairmentPct: 0,
};

export type ThermoPresetName =
  | 'normothermic'
  | 'feverViral'
  | 'feverOnAntipyretic'
  | 'heatStrokeExertional'
  | 'mildHypothermia'
  | 'deepHypothermia';

/**
 * The presets separate the three questions this module exists to teach: is the temperature
 * DEFENDED (fever) or OVERWHELMED (hyperthermia); how much of the evaporative reserve
 * remains; and what happens when defences fail in the cold.
 */
export const THERMO_PRESETS: Record<ThermoPresetName, Partial<ThermoInputs>> = {
  normothermic: { ...DEFAULT_THERMO_INPUTS },
  feverViral: { ...DEFAULT_THERMO_INPUTS, ambientTemperatureC: 22, pyrogenLevel: 62 },
  // The same viral pyrogen load with an antipyretic on board. Antipyretics do not cool the body;
  // they block PGE2 synthesis and lower the set point the hypothalamus is defending, which in this
  // model IS the pyrogen term — so the scenario is the same illness at a blunted set point.
  feverOnAntipyretic: { ...DEFAULT_THERMO_INPUTS, ambientTemperatureC: 22, pyrogenLevel: 16 },
  heatStrokeExertional: {
    ...DEFAULT_THERMO_INPUTS,
    ambientTemperatureC: 38,
    humidityPct: 92,
    metabolicRateMultiplier: 9,
    sweatImpairmentPct: 35,
  },
  mildHypothermia: { ...DEFAULT_THERMO_INPUTS, ambientTemperatureC: -5, humidityPct: 60, metabolicRateMultiplier: 1.2, windWetnessPct: 56 },
  deepHypothermia: { ...DEFAULT_THERMO_INPUTS, ambientTemperatureC: -18, humidityPct: 60, metabolicRateMultiplier: 1, windWetnessPct: 70 },
};

export const THERMO_PRESET_LABELS: Record<ThermoPresetName, string> = {
  normothermic: 'Normothermic',
  feverViral: 'Fever (viral)',
  feverOnAntipyretic: 'Fever + antipyretic',
  heatStrokeExertional: 'Exertional heat stroke',
  mildHypothermia: 'Mild hypothermia',
  deepHypothermia: 'Deep hypothermia',
};

export const THERMO_PRESET_ORDER: ThermoPresetName[] = [
  'normothermic',
  'feverViral',
  'feverOnAntipyretic',
  'heatStrokeExertional',
  'mildHypothermia',
  'deepHypothermia',
];

/**
 * One line under a scenario's name on a quiz option: what this state IS, never what its numbers
 * do. See `SHOCK_PRESET_GLOSS` for why that distinction is load-bearing — a gloss reporting a row
 * of the panel would answer the pattern questions from the options alone. `questions.test.ts`
 * holds it: no gloss may name a panel row or quote a figure.
 */
export const THERMO_PRESET_GLOSS: Partial<Record<ThermoPresetName, string>> = {
  normothermic: 'the body holding its own heat balance with nothing asked of its defences',
  feverViral: 'the thermostat itself turned up by pyrogens',
  feverOnAntipyretic: 'the raised thermostat brought back down by drug',
  heatStrokeExertional: 'defences overwhelmed while the thermostat never moved',
  mildHypothermia: 'heat lost faster than the body can make it',
  deepHypothermia: 'so cold that the defences have themselves failed',
};
