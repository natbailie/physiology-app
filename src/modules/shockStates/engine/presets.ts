import type { ShockInputs } from './types';

export const DEFAULT_SHOCK_INPUTS: ShockInputs = {
  bloodVolumeMl: 5000,
  contractility: 1,
  systemicVascularResistance: 1,
  pericardialPressureMmHg: 0,
  pulmonaryVascularResistance: 1,
  tissueExtractionCapacity: 1,
  oxygenDemandMlPerMin: 250,
  haemoglobinGDl: 15,
  baroreflexGain: 1,
};

export type ShockPresetName =
  | 'normal'
  | 'haemorrhagic'
  | 'cardiogenic'
  | 'septic'
  | 'tamponade'
  | 'pulmonaryEmbolism'
  | 'anaphylaxis'
  | 'decompensating';

/**
 * Each preset is chosen to produce a DISTINCT combination of output, filling pressures and
 * resistance. Reading which combination is present is the skill this module exists to build,
 * because the four states look similar at the bedside and their treatments are opposites.
 */
export const SHOCK_PRESETS: Record<ShockPresetName, Partial<ShockInputs>> = {
  normal: { ...DEFAULT_SHOCK_INPUTS },
  // Blood lost from the circuit: everything empties. Note haemoglobin falls too, so oxygen
  // delivery is hit twice over — by the flow term and by the carriage term.
  haemorrhagic: { ...DEFAULT_SHOCK_INPUTS, bloodVolumeMl: 3000, haemoglobinGDl: 7.5 },
  // The pump cannot clear what reaches it, so both filling pressures rise while output falls.
  // Fluid here makes matters worse, which is why classifying before treating matters.
  cardiogenic: { ...DEFAULT_SHOCK_INPUTS, contractility: 0.28 },
  // Vasodilatation with preserved output, and impaired extraction on top — the combination
  // that produces a HIGH mixed venous saturation in a patient who is making lactate.
  septic: {
    ...DEFAULT_SHOCK_INPUTS,
    systemicVascularResistance: 0.33,
    tissueExtractionCapacity: 0.24,
    oxygenDemandMlPerMin: 340,
  },
  // Fluid in the pericardium compresses the heart from outside. Measured CVP is high while
  // TRUE filling is low — the one state where a high venous pressure means an empty ventricle.
  tamponade: { ...DEFAULT_SHOCK_INPUTS, pericardialPressureMmHg: 12 },
  // The obstruction sits between the two measurements: high CVP, low wedge.
  pulmonaryEmbolism: { ...DEFAULT_SHOCK_INPUTS, pulmonaryVascularResistance: 9 },
  // Distributive, with capillary leak reducing the effective circulating volume as well.
  anaphylaxis: { ...DEFAULT_SHOCK_INPUTS, systemicVascularResistance: 0.28, bloodVolumeMl: 4100 },
  // The same blood loss as the haemorrhagic preset, with the reflex removed. Watch what the
  // compensation had been hiding.
  decompensating: { ...DEFAULT_SHOCK_INPUTS, bloodVolumeMl: 3000, haemoglobinGDl: 7.5, baroreflexGain: 0 },
};

export const SHOCK_PRESET_LABELS: Record<ShockPresetName, string> = {
  normal: 'Normal',
  haemorrhagic: 'Haemorrhagic',
  cardiogenic: 'Cardiogenic',
  septic: 'Septic',
  tamponade: 'Tamponade',
  pulmonaryEmbolism: 'Pulmonary embolism',
  anaphylaxis: 'Anaphylaxis',
  decompensating: 'Reflex exhausted',
};

export const SHOCK_PRESET_ORDER: ShockPresetName[] = [
  'normal',
  'haemorrhagic',
  'cardiogenic',
  'septic',
  'tamponade',
  'pulmonaryEmbolism',
  'anaphylaxis',
  'decompensating',
];
