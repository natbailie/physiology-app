import type { RespMechInputs } from './types';

export const DEFAULT_RESP_MECH_INPUTS: RespMechInputs = {
  respiratoryRate: 14,
  tidalVolumeML: 500,
  lungCompliance: 100,
  airwayResistance: 1,
  surfactantFunction: 1,
  deadSpaceFraction: 0,
  shuntFraction: 0,
  hpvStrength: 1,
};

export type RespMechPresetName = 'normal' | 'copd' | 'pulmonaryFibrosis' | 'neonatalRDS' | 'pulmonaryEmbolism' | 'pneumonia';

export const RESP_MECH_PRESETS: Record<RespMechPresetName, Partial<RespMechInputs>> = {
  normal: { ...DEFAULT_RESP_MECH_INPUTS },
  // Obstructive: high resistance lengthens the time constant, scooping the flow-volume loop,
  // dropping FEV1/FVC, and trapping air so residual volume and FRC rise.
  copd: { ...DEFAULT_RESP_MECH_INPUTS, airwayResistance: 12 },
  // Restrictive: stiff lungs cut vital capacity, but emptying is if anything FASTER, so the
  // FEV1/FVC ratio is preserved or even raised — the key contrast with obstruction.
  pulmonaryFibrosis: { ...DEFAULT_RESP_MECH_INPUTS, lungCompliance: 30 },
  // Surfactant deficiency stiffens the lung by a different route than fibrosis does.
  neonatalRDS: { ...DEFAULT_RESP_MECH_INPUTS, surfactantFunction: 0.08, tidalVolumeML: 350, respiratoryRate: 30 },
  // Dead space: ventilated but not perfused. HPV cannot help — there is no perfusion left in
  // that unit to redirect.
  pulmonaryEmbolism: { ...DEFAULT_RESP_MECH_INPUTS, deadSpaceFraction: 45 },
  // Shunt: perfused but not ventilated. HPV CAN partially compensate by diverting blood away.
  pneumonia: { ...DEFAULT_RESP_MECH_INPUTS, shuntFraction: 35 },
};

export const RESP_MECH_PRESET_LABELS: Record<RespMechPresetName, string> = {
  normal: 'Normal',
  copd: 'COPD (obstructive)',
  pulmonaryFibrosis: 'Fibrosis (restrictive)',
  neonatalRDS: 'Neonatal RDS',
  pulmonaryEmbolism: 'Pulmonary embolism',
  pneumonia: 'Pneumonia (shunt)',
};

export const PRESET_ORDER: RespMechPresetName[] = ['normal', 'copd', 'pulmonaryFibrosis', 'neonatalRDS', 'pulmonaryEmbolism', 'pneumonia'];
