import type { MedullaInputs } from './types';

export const DEFAULT_MEDULLA_INPUTS: MedullaInputs = {
  tumourSecretionRate: 0,
  noradrenalineFractionPct: 80,
  alphaBlockadePct: 0,
  betaBlockadePct: 0,
};

export type MedullaPresetName =
  | 'normal'
  | 'naPhaeochromocytoma'
  | 'adPhaeochromocytoma'
  | 'crisisUncontrolled'
  | 'betaFirstError'
  | 'properlyBlocked';

/**
 * The presets separate WHERE the secretion comes from and WHAT the prescriber did about it.
 * The beta-first preset is the exam's favourite trap: same tumour, worse pressure than no
 * treatment at all.
 */
export const MEDULLA_PRESETS: Record<MedullaPresetName, Partial<MedullaInputs>> = {
  normal: { ...DEFAULT_MEDULLA_INPUTS },
  naPhaeochromocytoma: { ...DEFAULT_MEDULLA_INPUTS, tumourSecretionRate: 55, noradrenalineFractionPct: 88 },
  adPhaeochromocytoma: { ...DEFAULT_MEDULLA_INPUTS, tumourSecretionRate: 45, noradrenalineFractionPct: 25 },
  crisisUncontrolled: { ...DEFAULT_MEDULLA_INPUTS, tumourSecretionRate: 92, noradrenalineFractionPct: 85 },
  betaFirstError: {
    ...DEFAULT_MEDULLA_INPUTS,
    tumourSecretionRate: 70,
    noradrenalineFractionPct: 85,
    betaBlockadePct: 75,
  },
  properlyBlocked: {
    ...DEFAULT_MEDULLA_INPUTS,
    tumourSecretionRate: 70,
    noradrenalineFractionPct: 85,
    alphaBlockadePct: 78,
    betaBlockadePct: 60,
  },
};

export const MEDULLA_PRESET_LABELS: Record<MedullaPresetName, string> = {
  normal: 'Normal',
  naPhaeochromocytoma: 'Phaeo: NA-predominant',
  adPhaeochromocytoma: 'Phaeo: adrenaline-predominant',
  crisisUncontrolled: 'Adrenergic crisis',
  betaFirstError: 'Beta-blocker given first',
  properlyBlocked: 'Alpha then beta (correct)',
};

export const MEDULLA_PRESET_ORDER: MedullaPresetName[] = [
  'normal',
  'naPhaeochromocytoma',
  'adPhaeochromocytoma',
  'crisisUncontrolled',
  'betaFirstError',
  'properlyBlocked',
];
