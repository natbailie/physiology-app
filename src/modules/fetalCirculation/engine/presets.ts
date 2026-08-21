import type { FetalInputs } from './types';

export const DEFAULT_FETAL_INPUTS: FetalInputs = {
  placentalCirculation: 1,
  lungInflation: 0,
  inspiredOxygen: 0.21,
  pulmonaryVasoreactivity: 1,
  prostaglandinLevel: 60,
  systemicToneScale: 1,
};

export type FetalPresetName =
  | 'fetal'
  | 'firstBreath'
  | 'transitioned'
  | 'pphn'
  | 'patentDuctus'
  | 'ductDependent';

/**
 * The presets walk the transition and then the two ways it goes wrong. Each produces a distinct
 * combination of pulmonary resistance, ductal shunt direction and the pre/post-ductal saturation
 * gap — which between them are what a neonatologist reads.
 */
export const FETAL_PRESETS: Record<FetalPresetName, Partial<FetalInputs>> = {
  // Lungs fluid-filled and hypoxic, placenta attached, duct held open by placental prostaglandin.
  fetal: { ...DEFAULT_FETAL_INPUTS },
  // The moment after delivery: cord clamped, lungs aerating, breathing room air.
  firstBreath: { ...DEFAULT_FETAL_INPUTS, placentalCirculation: 0, lungInflation: 1, prostaglandinLevel: 0 },
  // Hours later: oxygen has closed the duct and pulmonary resistance has fallen.
  transitioned: {
    ...DEFAULT_FETAL_INPUTS,
    placentalCirculation: 0,
    lungInflation: 1,
    inspiredOxygen: 0.21,
    prostaglandinLevel: 0,
  },
  // Persistent pulmonary hypertension: the lung is inflated but will not relax, so the fetal
  // shunts persist and the baby stays hypoxic despite adequate ventilation.
  pphn: {
    ...DEFAULT_FETAL_INPUTS,
    placentalCirculation: 0,
    lungInflation: 1,
    prostaglandinLevel: 0,
    pulmonaryVasoreactivity: 0.08,
  },
  // A duct that never closed. Now that systemic resistance exceeds pulmonary, the SAME channel
  // carries flow the other way — left to right, flooding the lungs.
  patentDuctus: {
    ...DEFAULT_FETAL_INPUTS,
    placentalCirculation: 0,
    lungInflation: 1,
    prostaglandinLevel: 100,
  },
  // A duct-dependent lesion held open deliberately with prostaglandin, on supplemental oxygen.
  ductDependent: {
    ...DEFAULT_FETAL_INPUTS,
    placentalCirculation: 0,
    lungInflation: 1,
    inspiredOxygen: 0.6,
    prostaglandinLevel: 100,
  },
};

export const FETAL_PRESET_LABELS: Record<FetalPresetName, string> = {
  fetal: 'In utero',
  firstBreath: 'First breath',
  transitioned: 'Transitioned',
  pphn: 'PPHN',
  patentDuctus: 'Patent ductus',
  ductDependent: 'Duct-dependent + prostin',
};

export const FETAL_PRESET_ORDER: FetalPresetName[] = [
  'fetal',
  'firstBreath',
  'transitioned',
  'pphn',
  'patentDuctus',
  'ductDependent',
];
