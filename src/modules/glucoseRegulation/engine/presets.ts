import type { GlucoseInputs } from './types';

export const DEFAULT_GLUCOSE_INPUTS: GlucoseInputs = {
  // Both of these are DOSES read at the moment their button is pressed, not settings the engine
  // integrates. At zero, "Eat meal" fed the patient nothing and "Give insulin" gave nothing, so a
  // learner opening the module and pressing either got no response at all — and the sliders behind
  // them look equally dead, because on their own they are. A default meal and a default correction
  // dose make the first press teach something; the sliders then change how much.
  mealCarbLoadGrams: 60,
  exogenousInsulinUnits: 6,
  insulinSecretionCapacity: 1,
  insulinResistance: 0,
  glucagonSecretionCapacity: 1,
};

export type GlucosePresetName = 'normal' | 'type1Diabetes' | 'type2Diabetes' | 'fasting' | 'insulinOverdose';

export const GLUCOSE_PRESETS: Record<GlucosePresetName, Partial<GlucoseInputs>> = {
  normal: { ...DEFAULT_GLUCOSE_INPUTS, mealCarbLoadGrams: 60 },
  // No endogenous insulin secretion at all — glucose climbs unchecked after a meal until
  // exogenous insulin is given (try "Give insulin" afterward).
  type1Diabetes: { ...DEFAULT_GLUCOSE_INPUTS, mealCarbLoadGrams: 60, insulinSecretionCapacity: 0 },
  // Secretion is intact (even compensatory hyperinsulinemia can occur) but peripheral tissue
  // response is blunted — the same post-meal hyperglycemia as T1DM, a different mechanism.
  type2Diabetes: { ...DEFAULT_GLUCOSE_INPUTS, mealCarbLoadGrams: 60, insulinResistance: 1.3 },
  // No meal queued — reset and watch glucagon/counter-regulation defend glucose as it drifts down.
  fasting: { ...DEFAULT_GLUCOSE_INPUTS, mealCarbLoadGrams: 0, exogenousInsulinUnits: 0 },
  // Set this, then use "Give insulin" repeatedly with no meal queued to watch counter-regulation engage.
  insulinOverdose: { ...DEFAULT_GLUCOSE_INPUTS, mealCarbLoadGrams: 0, exogenousInsulinUnits: 15 },
};

export const GLUCOSE_PRESET_LABELS: Record<GlucosePresetName, string> = {
  normal: 'Normal meal response',
  type1Diabetes: 'Type 1 diabetes',
  type2Diabetes: 'Type 2 diabetes',
  fasting: 'Fasting',
  insulinOverdose: 'Insulin overdose',
};

export const PRESET_ORDER: GlucosePresetName[] = ['normal', 'type1Diabetes', 'type2Diabetes', 'fasting', 'insulinOverdose'];
