import type { CalciumInputs } from './types';

export const DEFAULT_CALCIUM_INPUTS: CalciumInputs = {
  dietaryCalciumIntake: 1000,
  dietaryPhosphateIntake: 1000,
  vitaminDIntake: 100,
  renalFunction: 1,
  parathyroidGlandFunction: 1,
  serumMagnesium: 2.0,
  autonomousPTHSecretion: 0,
};

export type CalciumPresetName =
  | 'normal'
  | 'primaryHyperparathyroidism'
  | 'hypoparathyroidism'
  | 'vitaminDDeficiency'
  | 'ckdMineralBoneDisease'
  | 'hypomagnesemia';

export const CALCIUM_PRESETS: Record<CalciumPresetName, Partial<CalciumInputs>> = {
  normal: { ...DEFAULT_CALCIUM_INPUTS },
  // Autonomous adenoma bypasses calcium feedback: high calcium with LOW phosphate (PTH is
  // phosphaturic) and an inappropriately non-suppressed PTH — the classic lab triad.
  primaryHyperparathyroidism: { ...DEFAULT_CALCIUM_INPUTS, autonomousPTHSecretion: 55 },
  // No PTH (e.g. post-thyroidectomy): the mirror image — low calcium with HIGH phosphate.
  hypoparathyroidism: { ...DEFAULT_CALCIUM_INPUTS, parathyroidGlandFunction: 0.05 },
  // No substrate for calcitriol: poor gut calcium absorption drives a compensatory
  // (secondary) PTH rise that defends calcium at the expense of bone.
  vitaminDDeficiency: { ...DEFAULT_CALCIUM_INPUTS, vitaminDIntake: 5 },
  // CKD-MBD: the failing kidney can neither activate vitamin D nor excrete phosphate, so
  // phosphate climbs and calcium falls, driving severe secondary hyperparathyroidism.
  ckdMineralBoneDisease: { ...DEFAULT_CALCIUM_INPUTS, renalFunction: 0.15 },
  // Severe hypomagnesemia: hypocalcemia with an inappropriately LOW PTH, refractory to
  // calcium replacement until the magnesium itself is corrected.
  hypomagnesemia: { ...DEFAULT_CALCIUM_INPUTS, serumMagnesium: 0.7 },
};

export const CALCIUM_PRESET_LABELS: Record<CalciumPresetName, string> = {
  normal: 'Normal',
  primaryHyperparathyroidism: 'Primary hyperparathyroidism',
  hypoparathyroidism: 'Hypoparathyroidism',
  vitaminDDeficiency: 'Vitamin D deficiency',
  ckdMineralBoneDisease: 'CKD-MBD',
  hypomagnesemia: 'Hypomagnesemia',
};

export const PRESET_ORDER: CalciumPresetName[] = [
  'normal',
  'primaryHyperparathyroidism',
  'hypoparathyroidism',
  'vitaminDDeficiency',
  'ckdMineralBoneDisease',
  'hypomagnesemia',
];
