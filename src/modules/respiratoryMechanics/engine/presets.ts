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
  //
  // The shunt magnitude is the closest agreement anywhere in the Pulse suite — we set 35% and
  // Pulse's moderate pneumonia settles at a shunt fraction of 0.35. But consolidation does more
  // than shunt, and this preset used to change nothing else: Pulse also cuts lung compliance
  // (0.20 -> 0.11 L/cmH2O), raises airway resistance (1.5 -> 3.6) and nearly doubles the
  // dead-space ratio (0.29 -> 0.55). A consolidated lung is stiffer and wastes more of each
  // breath, and a student saw none of that. Scaled to the same FRACTIONS of our own baseline,
  // because our compliance is respiratory-system compliance where Pulse's is lung compliance.
  pneumonia: {
    ...DEFAULT_RESP_MECH_INPUTS,
    shuntFraction: 35,
    lungCompliance: 55,
    airwayResistance: 2.4,
    deadSpaceFraction: 25,
    // Rapid and shallow, the pattern a stiff lung is driven to — and the reason the work of
    // breathing rises even though each breath is smaller.
    respiratoryRate: 24,
    tidalVolumeML: 380,
  },
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
