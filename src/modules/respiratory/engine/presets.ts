import type { RespInputs } from './types';

export const DEFAULT_RESP_INPUTS: RespInputs = {
  minuteVentilation: 100,
  fiO2: 0.21,
  co2Production: 100,
  metabolicAcidLoad: 0,
  renalCompensationCapacity: 1,
};

export type RespPresetName = 'normal' | 'copdChronicAcidosis' | 'panicHyperventilation' | 'dkaMetabolicAcidosis' | 'highAltitude';

export const RESP_PRESETS: Record<RespPresetName, Partial<RespInputs>> = {
  normal: { ...DEFAULT_RESP_INPUTS },
  // Chronic hypoventilation — renal compensation (slow) partially normalizes pH over time.
  // Severe enough to be genuinely hypoxaemic on room air (PaO2 ~55, SaO2 ~88%), not just
  // hypercapnic: a retainer who is not hypoxaemic is never given oxygen, so the milder
  // setting this replaced could not show what oxygen does to such a patient.
  copdChronicAcidosis: { minuteVentilation: 30 },
  // Acute hyperventilation, e.g. a panic attack — renal compensation hasn't had time to engage.
  panicHyperventilation: { minuteVentilation: 220 },
  // Ketoacid production drives a primary metabolic acidosis; Kussmaul hyperventilation
  // emerges from the chemoreceptor reflex alone — minuteVentilation stays at baseline.
  dkaMetabolicAcidosis: { metabolicAcidLoad: 70 },
  // Reduced inspired O2 (modeling reduced atmospheric pressure at altitude).
  highAltitude: { fiO2: 0.12 },
};

export const RESP_PRESET_LABELS: Record<RespPresetName, string> = {
  normal: 'Normal',
  copdChronicAcidosis: 'COPD (chronic)',
  panicHyperventilation: 'Panic attack',
  dkaMetabolicAcidosis: 'DKA',
  highAltitude: 'High altitude',
};

export const PRESET_ORDER: RespPresetName[] = [
  'normal',
  'copdChronicAcidosis',
  'panicHyperventilation',
  'dkaMetabolicAcidosis',
  'highAltitude',
];
