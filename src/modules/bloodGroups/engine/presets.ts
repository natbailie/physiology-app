import type { BloodInputs } from './types';

export const DEFAULT_BLOOD_INPUTS: BloodInputs = {
  recipientAboIndex: 0,
  recipientRhPositive: 1,
  donorAboIndex: 0,
  donorRhPositive: 1,
  rhSensitised: 0,
  transfusionVolumeMl: 350,
};

export type BloodPresetName =
  | 'compatibleMatch'
  | 'oToA'
  | 'aToO'
  | 'oRecipientGetsAb'
  | 'abUniversal'
  | 'rhSensitisedMismatch'
  | 'massiveMismatch';

/**
 * The presets are the five transfusion scenarios every exam asks. Note the quiet one:
 * an AB recipient given O red cells is COMPATIBLE — the "universal donor" logic runs on
 * the DONOR's plasma being absent from red-cell units, not on O having no antigens.
 */
export const BLOOD_PRESETS: Record<BloodPresetName, Partial<BloodInputs>> = {
  compatibleMatch: { ...DEFAULT_BLOOD_INPUTS },
  // O red cells carry neither antigen: an A patient accepts them despite anti-B antibodies.
  oToA: { ...DEFAULT_BLOOD_INPUTS, recipientAboIndex: 1, donorAboIndex: 0 },
  // An A unit into an O patient: preformed anti-A meets A antigen — the classic catastrophe.
  aToO: { ...DEFAULT_BLOOD_INPUTS, recipientAboIndex: 0, donorAboIndex: 1 },
  abUniversal: { ...DEFAULT_BLOOD_INPUTS, recipientAboIndex: 3, donorAboIndex: 0 },
  oRecipientGetsAb: { ...DEFAULT_BLOOD_INPUTS, recipientAboIndex: 0, donorAboIndex: 3, transfusionVolumeMl: 300 },
  rhSensitisedMismatch: {
    ...DEFAULT_BLOOD_INPUTS,
    recipientAboIndex: 0,
    recipientRhPositive: 0,
    donorRhPositive: 1,
    rhSensitised: 1,
    transfusionVolumeMl: 300,
  },
  massiveMismatch: {
    ...DEFAULT_BLOOD_INPUTS,
    recipientAboIndex: 0,
    donorAboIndex: 1,
    transfusionVolumeMl: 500,
  },
};

export const BLOOD_PRESET_LABELS: Record<BloodPresetName, string> = {
  compatibleMatch: 'Compatible match',
  oToA: 'O unit → A patient',
  aToO: 'A unit → O patient',
  abUniversal: 'O unit → AB patient',
  oRecipientGetsAb: 'AB unit → O patient',
  rhSensitisedMismatch: 'Rh+ unit → sensitised Rh−',
  massiveMismatch: 'Massive ABO mismatch (500 mL)',
};

export const BLOOD_PRESET_ORDER: BloodPresetName[] = [
  'compatibleMatch',
  'oToA',
  'abUniversal',
  'aToO',
  'oRecipientGetsAb',
  'rhSensitisedMismatch',
  'massiveMismatch',
];
