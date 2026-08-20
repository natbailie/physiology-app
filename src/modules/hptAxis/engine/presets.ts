import type { HptInputs } from './types';

export const DEFAULT_HPT_INPUTS: HptInputs = {
  thyroidGlandFunction: 1,
  pituitaryTshFunction: 1,
  autonomousThyroidStimulation: 0,
  exogenousLevothyroxine: 0,
  illnessSeverity: 0,
};

export type HptPresetName = 'normal' | 'primaryHypothyroidism' | 'secondaryHypothyroidism' | 'graves' | 'sickEuthyroid';

export const HPT_PRESETS: Record<HptPresetName, Partial<HptInputs>> = {
  normal: { ...DEFAULT_HPT_INPUTS },
  // Primary hypothyroidism (Hashimoto's): the gland can't respond to TSH, so TSH rises unchecked.
  primaryHypothyroidism: { thyroidGlandFunction: 0.15 },
  // Secondary hypothyroidism: the pituitary can't drive TSH, so both TSH and T4 are low.
  secondaryHypothyroidism: { pituitaryTshFunction: 0.15 },
  // Graves' disease: TSH-independent thyroid stimulation suppresses TSH via feedback.
  graves: { autonomousThyroidStimulation: 60 },
  // Sick euthyroid syndrome: illness suppresses peripheral conversion; TSH/T4 stay near-normal.
  sickEuthyroid: { illnessSeverity: 70 },
};

export const HPT_PRESET_LABELS: Record<HptPresetName, string> = {
  normal: 'Normal',
  primaryHypothyroidism: "Hashimoto's",
  secondaryHypothyroidism: 'Secondary hypothyroidism',
  graves: "Graves' disease",
  sickEuthyroid: 'Sick euthyroid',
};

export const PRESET_ORDER: HptPresetName[] = ['normal', 'primaryHypothyroidism', 'secondaryHypothyroidism', 'graves', 'sickEuthyroid'];
