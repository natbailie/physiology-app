import type { HpaInputs } from './types';

export const DEFAULT_HPA_INPUTS: HpaInputs = {
  acuteStressLevel: 10,
  exogenousGlucocorticoid: 0,
  pituitaryFunction: 1,
  adrenalCortexFunction: 1,
  autonomousAdrenalSecretion: 0,
};

export type HpaPresetName = 'normal' | 'addisons' | 'secondaryInsufficiency' | 'steroidTherapy' | 'adrenalAdenoma';

export const HPA_PRESETS: Record<HpaPresetName, Partial<HpaInputs>> = {
  normal: { ...DEFAULT_HPA_INPUTS },
  // Primary adrenal insufficiency: the gland can't respond to ACTH, so ACTH rises unchecked.
  addisons: { adrenalCortexFunction: 0.1 },
  // Secondary adrenal insufficiency: the pituitary can't drive ACTH, so both ACTH and cortisol are low.
  secondaryInsufficiency: { pituitaryFunction: 0.1 },
  // Sustained exogenous glucocorticoid — suppresses the axis and, over time, atrophies the adrenal reserve.
  steroidTherapy: { exogenousGlucocorticoid: 150 },
  // ACTH-independent (autonomous) cortisol secretion from an adrenal adenoma suppresses ACTH via feedback.
  adrenalAdenoma: { autonomousAdrenalSecretion: 60 },
};

export const HPA_PRESET_LABELS: Record<HpaPresetName, string> = {
  normal: 'Normal',
  addisons: "Addison's disease",
  secondaryInsufficiency: 'Secondary insufficiency',
  steroidTherapy: 'Steroid therapy',
  adrenalAdenoma: 'Adrenal adenoma',
};

export const PRESET_ORDER: HpaPresetName[] = ['normal', 'addisons', 'secondaryInsufficiency', 'steroidTherapy', 'adrenalAdenoma'];
