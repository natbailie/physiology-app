import type { AdrenalCortexInputs } from './types';

export const DEFAULT_ADRENAL_INPUTS: AdrenalCortexInputs = {
  acthDrivePct: 100,
  block21Pct: 0,
  block11Pct: 0,
  block17Pct: 0,
  block3bhsdPct: 0,
  replacementTherapyPct: 0,
};

export type AdrenalCortexPresetName =
  | 'normal'
  | 'cah21SaltWasting'
  | 'cah21Treated'
  | 'cah21SimpleVirilising'
  | 'cah11'
  | 'cah17'
  | 'cah3b';

/**
 * The four enzyme blocks each leave a different fingerprint across the same four readouts:
 * cortisol, mineralocorticoid activity, androgens and the 17-OHP marker. Salt-wasting versus
 * hypertension, virilised versus under-virilised — the matrix IS the diagnosis.
 */
export const ADRENAL_PRESETS: Record<AdrenalCortexPresetName, Partial<AdrenalCortexInputs>> = {
  normal: { ...DEFAULT_ADRENAL_INPUTS },
  cah21SaltWasting: { ...DEFAULT_ADRENAL_INPUTS, block21Pct: 96 },
  cah21Treated: { ...DEFAULT_ADRENAL_INPUTS, block21Pct: 96, replacementTherapyPct: 85 },
  cah21SimpleVirilising: { ...DEFAULT_ADRENAL_INPUTS, block21Pct: 62 },
  cah11: { ...DEFAULT_ADRENAL_INPUTS, block11Pct: 92 },
  cah17: { ...DEFAULT_ADRENAL_INPUTS, block17Pct: 93 },
  cah3b: { ...DEFAULT_ADRENAL_INPUTS, block3bhsdPct: 90 },
};

export const ADRENAL_PRESET_LABELS: Record<AdrenalCortexPresetName, string> = {
  normal: 'Normal',
  cah21SaltWasting: '21-OH: salt-wasting',
  cah21Treated: '21-OH: on replacement',
  cah21SimpleVirilising: '21-OH: simple virilising',
  cah11: '11β-OH deficiency',
  cah17: '17α-OH deficiency',
  cah3b: '3β-HSD deficiency',
};

export const ADRENAL_PRESET_ORDER: AdrenalCortexPresetName[] = [
  'normal',
  'cah21SaltWasting',
  'cah21Treated',
  'cah21SimpleVirilising',
  'cah11',
  'cah17',
  'cah3b',
];
