import type { HearingInputs } from './types';

export const DEFAULT_HEARING_INPUTS: HearingInputs = {
  stimulusFrequencyHz: 1000,
  stimulusLevelDbHl: 40,
  outerHairCellIntegrity: 1,
  innerHairCellIntegrity: 1,
  conductiveLossDb: 0,
  noiseNotchDepthDb: 0,
  presbycusisSeverity: 0,
  meniereLowFreqLossDb: 0,
};

export type HearingPresetName =
  | 'normal'
  | 'otosclerosis'
  | 'noiseNotch'
  | 'presbycusis'
  | 'menieres'
  | 'severeCochlearLoss';

/**
 * Each preset produces a distinguishable audiogram, tuning-fork set and loudness behaviour.
 * The discrimination between them is the clinical skill this module teaches: WHERE the loss
 * sits (gap vs no gap) and WHAT the cochlea still does with what it receives (recruitment,
 * distortion).
 */
export const HEARING_PRESETS: Record<HearingPresetName, Partial<HearingInputs>> = {
  normal: { ...DEFAULT_HEARING_INPUTS },
  // Stapes fixation: air conduction blocked, cochlea untouched — bone hears everything.
  otosclerosis: { ...DEFAULT_HEARING_INPUTS, conductiveLossDb: 40 },
  // Years of unprotected noise exposure: notch at 4 kHz plus amplifier loss and recruitment.
  noiseNotch: { ...DEFAULT_HEARING_INPUTS, outerHairCellIntegrity: 0.55, noiseNotchDepthDb: 45 },
  presbycusis: { ...DEFAULT_HEARING_INPUTS, presbycusisSeverity: 0.8 },
  menieres: { ...DEFAULT_HEARING_INPUTS, outerHairCellIntegrity: 0.75, meniereLowFreqLossDb: 45 },
  severeCochlearLoss: { ...DEFAULT_HEARING_INPUTS, innerHairCellIntegrity: 0.15, outerHairCellIntegrity: 0.3 },
};

export const HEARING_PRESET_LABELS: Record<HearingPresetName, string> = {
  normal: 'Normal',
  otosclerosis: 'Otosclerosis',
  noiseNotch: 'Noise-induced loss',
  presbycusis: 'Presbycusis',
  menieres: "Ménière's disease",
  severeCochlearLoss: 'Severe cochlear loss',
};

export const HEARING_PRESET_ORDER: HearingPresetName[] = [
  'normal',
  'otosclerosis',
  'noiseNotch',
  'presbycusis',
  'menieres',
  'severeCochlearLoss',
];
