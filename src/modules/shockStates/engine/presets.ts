import type { ShockInputs } from './types';

export const DEFAULT_SHOCK_INPUTS: ShockInputs = {
  bloodVolumeMl: 5000,
  contractility: 1,
  systemicVascularResistance: 1,
  pericardialPressureMmHg: 0,
  pulmonaryVascularResistance: 1,
  tissueExtractionCapacity: 1,
  oxygenDemandMlPerMin: 250,
  haemoglobinGDl: 15,
  baroreflexGain: 1,
};

export type ShockPresetName =
  | 'normal'
  | 'haemorrhagic'
  | 'cardiogenic'
  | 'septic'
  | 'tamponade'
  | 'pulmonaryEmbolism'
  | 'anaphylaxis'
  | 'resuscitated'
  | 'decompensating';

/**
 * Each preset is chosen to produce a DISTINCT combination of output, filling pressures and
 * resistance. Reading which combination is present is the skill this module exists to build,
 * because the four states look similar at the bedside and their treatments are opposites.
 */
export const SHOCK_PRESETS: Record<ShockPresetName, Partial<ShockInputs>> = {
  normal: { ...DEFAULT_SHOCK_INPUTS },
  // Blood lost from the circuit: everything empties.
  //
  // Haemoglobin CONCENTRATION stays near normal, because whole blood is what is being lost — cells
  // and plasma leave together. Pulse's four no-fluid haemorrhage traces agree across the whole
  // ladder: 14.95 g/dL falls only to 14.79, 14.70, 14.42 and 14.67 at losses of 15, 25, 35 and 42
  // percent. This preset used to set 7.5 g/dL, which inverted the clinical teaching — a normal
  // haemoglobin does NOT exclude massive blood loss, and it is the commonest way an early bleed is
  // missed. Oxygen delivery here is hit by the FLOW term alone; `resuscitated` below is where the
  // carriage term goes, because that is a different patient.
  //
  // A COMPENSATED Class III bleed — about 28% of blood volume — which is where this module's
  // headline lesson lives: a pressure that still reads acceptable over a cardiac index that has
  // collapsed. The volume used to be 3000 mL, chosen when filling pressure fell only in proportion
  // to volume and a 40% loss still produced a survivable pressure. Against the corrected
  // pressure-volume relationship 3000 mL is Class IV and reads MAP 35 — a different patient, and
  // not the one the classification trap is about. `decompensating` is this same bleed with the
  // reflex removed, so the pair is a controlled comparison.
  haemorrhagic: { ...DEFAULT_SHOCK_INPUTS, bloodVolumeMl: 3600, haemoglobinGDl: 14.5 },
  // The pump cannot clear what reaches it, so both filling pressures rise while output falls.
  // Fluid here makes matters worse, which is why classifying before treating matters.
  cardiogenic: { ...DEFAULT_SHOCK_INPUTS, contractility: 0.28 },
  // Vasodilatation with preserved output, and impaired extraction on top — the combination
  // that produces a HIGH mixed venous saturation in a patient who is making lactate.
  septic: {
    ...DEFAULT_SHOCK_INPUTS,
    systemicVascularResistance: 0.33,
    tissueExtractionCapacity: 0.24,
    oxygenDemandMlPerMin: 340,
  },
  // Fluid in the pericardium compresses the heart from outside. Measured CVP is high while
  // TRUE filling is low — the one state where a high venous pressure means an empty ventricle.
  tamponade: { ...DEFAULT_SHOCK_INPUTS, pericardialPressureMmHg: 12 },
  // The obstruction sits between the two measurements: high CVP, low wedge.
  pulmonaryEmbolism: { ...DEFAULT_SHOCK_INPUTS, pulmonaryVascularResistance: 9 },
  // Distributive, with capillary leak reducing the effective circulating volume as well.
  anaphylaxis: { ...DEFAULT_SHOCK_INPUTS, systemicVascularResistance: 0.28, bloodVolumeMl: 4100 },
  // The same bleed, hours later and after crystalloid. Volume is largely restored, so the flow term
  // recovers — and the haemoglobin that looked reassuring during the bleed is now frankly low,
  // because the red cells that were lost have been replaced with salt water. This is the state most
  // patients are in by the time anyone measures a haemoglobin, and splitting it out is what lets the
  // two terms of oxygen delivery be taught separately instead of at once.
  //
  // The haemoglobin was 7.5 g/dL when this preset was first written, which was an inference rather
  // than a measurement. `hemorrhage-class2-saline` settles it: Pulse's crystalloid-resuscitated
  // Class II bleed lands at 13.2 g/dL, and reaching 7.5 by dilution alone would need a blood volume
  // near 8 L, which is not a patient. 10.5 g/dL is what a larger bleed — about 40% of red cell mass
  // — looks like once its volume has been restored: clearly anaemic, well below the 13-17 g/dL
  // reference range, and still above the 7 g/dL transfusion threshold, which is a teaching point of
  // its own.
  resuscitated: { ...DEFAULT_SHOCK_INPUTS, bloodVolumeMl: 4700, haemoglobinGDl: 10.5 },
  // The same blood loss as the haemorrhagic preset, with the reflex removed. Watch what the
  // compensation had been hiding.
  decompensating: { ...DEFAULT_SHOCK_INPUTS, bloodVolumeMl: 3600, haemoglobinGDl: 14.5, baroreflexGain: 0 },
};

export const SHOCK_PRESET_LABELS: Record<ShockPresetName, string> = {
  normal: 'Normal',
  haemorrhagic: 'Haemorrhagic',
  cardiogenic: 'Cardiogenic',
  septic: 'Septic',
  tamponade: 'Tamponade',
  pulmonaryEmbolism: 'Pulmonary embolism',
  anaphylaxis: 'Anaphylaxis',
  resuscitated: 'Resuscitated bleed',
  decompensating: 'Reflex exhausted',
};

export const SHOCK_PRESET_ORDER: ShockPresetName[] = [
  'normal',
  'haemorrhagic',
  'cardiogenic',
  'septic',
  'tamponade',
  'pulmonaryEmbolism',
  'anaphylaxis',
  'resuscitated',
  'decompensating',
];
