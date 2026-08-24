import type { PituitaryInputs } from './types';

export const DEFAULT_PITUITARY_INPUTS: PituitaryInputs = {
  ghAdenomaSecretion: 0,
  prolactinomaSecretion: 0,
  nonfunctioningMass: 0,
  dopamineTonePct: 100,
  d2ReceptorBlockPct: 0,
  trhStimulusUnits: 10,
  epiphysesOpen: 0,
};

export type PituitaryPresetName =
  | 'normal'
  | 'acromegaly'
  | 'gigantism'
  | 'microprolactinoma'
  | 'macroprolactinoma'
  | 'antipsychoticHyperprl'
  | 'hypothyroidHyperprl'
  | 'nonFunctioningMass';

/**
 * The presets separate WHAT is secreted (GH vs prolactin), WHY prolactin rises (adenoma vs
 * lost brake vs TRH drive) and WHEN in skeletal life GH strikes (open vs fused epiphyses).
 * The glucose-suppression test and the drug history are the discriminators boards test.
 */
export const PITUITARY_PRESETS: Record<PituitaryPresetName, Partial<PituitaryInputs>> = {
  normal: { ...DEFAULT_PITUITARY_INPUTS },
  acromegaly: { ...DEFAULT_PITUITARY_INPUTS, ghAdenomaSecretion: 70 },
  gigantism: { ...DEFAULT_PITUITARY_INPUTS, ghAdenomaSecretion: 75, epiphysesOpen: 1 },
  microprolactinoma: { ...DEFAULT_PITUITARY_INPUTS, prolactinomaSecretion: 8 },
  macroprolactinoma: { ...DEFAULT_PITUITARY_INPUTS, prolactinomaSecretion: 48 },
  antipsychoticHyperprl: { ...DEFAULT_PITUITARY_INPUTS, d2ReceptorBlockPct: 85 },
  hypothyroidHyperprl: { ...DEFAULT_PITUITARY_INPUTS, trhStimulusUnits: 80 },
  nonFunctioningMass: { ...DEFAULT_PITUITARY_INPUTS, nonfunctioningMass: 62 },
};

export const PITUITARY_PRESET_LABELS: Record<PituitaryPresetName, string> = {
  normal: 'Normal',
  acromegaly: 'Acromegaly',
  gigantism: 'Gigantism',
  microprolactinoma: 'Microprolactinoma',
  macroprolactinoma: 'Macroprolactinoma',
  antipsychoticHyperprl: 'Antipsychotic effect',
  hypothyroidHyperprl: 'Hypothyroid (TRH-driven)',
  nonFunctioningMass: 'Non-functioning mass',
};

export const PITUITARY_PRESET_ORDER: PituitaryPresetName[] = [
  'normal',
  'acromegaly',
  'gigantism',
  'microprolactinoma',
  'macroprolactinoma',
  'antipsychoticHyperprl',
  'hypothyroidHyperprl',
  'nonFunctioningMass',
];
