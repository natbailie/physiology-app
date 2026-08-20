import type { CoagInputs } from './types';

export const DEFAULT_COAG_INPUTS: CoagInputs = {
  factorVIIIActivity: 100,
  factorIXActivity: 100,
  vitaminKDependentFactors: 100,
  vonWillebrandFactor: 100,
  plateletCount: 250,
  fibrinogenLevel: 100,
  heparinDose: 0,
  aspirinDose: 0,
  fibrinolyticActivity: 100,
};

export type CoagPresetName =
  | 'normal'
  | 'hemophiliaA'
  | 'warfarin'
  | 'liverDisease'
  | 'dic'
  | 'vonWillebrand'
  | 'heparin'
  | 'thrombocytopenia';

/**
 * Each preset is chosen to produce a DISTINCT pattern across PT / APTT / platelets / bleeding
 * time. Reading which combination is abnormal is how the defect gets localised, and it is the
 * skill this module exists to build.
 */
export const COAG_PRESETS: Record<CoagPresetName, Partial<CoagInputs>> = {
  normal: { ...DEFAULT_COAG_INPUTS },
  // Intrinsic limb only: long APTT, completely normal PT. Hemophilia B looks the same — drop
  // factor IX instead and see for yourself.
  hemophiliaA: { ...DEFAULT_COAG_INPUTS, factorVIIIActivity: 2 },
  // Factor VII has the shortest half-life, so the extrinsic limb fails first: PT and INR rise
  // before the APTT is meaningfully affected.
  warfarin: { ...DEFAULT_COAG_INPUTS, vitaminKDependentFactors: 22 },
  // The liver makes nearly every factor including fibrinogen, so everything falls together —
  // but unlike DIC, there is no runaway lysis, so the D-dimer stays low.
  liverDisease: { ...DEFAULT_COAG_INPUTS, vitaminKDependentFactors: 32, fibrinogenLevel: 42 },
  // Simultaneous runaway clotting AND bleeding: factors and platelets are consumed, fibrinogen
  // is stripped out, and rampant lysis sends the D-dimer through the roof. That last value is
  // what separates DIC from liver disease on an otherwise similar panel.
  dic: {
    ...DEFAULT_COAG_INPUTS,
    vitaminKDependentFactors: 34,
    fibrinogenLevel: 25,
    plateletCount: 45,
    fibrinolyticActivity: 280,
  },
  // A platelet-type bleeding disorder that ALSO mildly prolongs the APTT, because vWF carries
  // factor VIII — the reason it can be mistaken for mild hemophilia A.
  vonWillebrand: { ...DEFAULT_COAG_INPUTS, vonWillebrandFactor: 12 },
  // Potentiates antithrombin: a markedly prolonged APTT with a barely-moved PT, which is why
  // the APTT is the test used to monitor it.
  heparin: { ...DEFAULT_COAG_INPUTS, heparinDose: 80 },
  // Primary haemostasis alone: a long bleeding time with a completely normal cascade screen —
  // the exact mirror image of hemophilia.
  thrombocytopenia: { ...DEFAULT_COAG_INPUTS, plateletCount: 18 },
};

export const COAG_PRESET_LABELS: Record<CoagPresetName, string> = {
  normal: 'Normal',
  hemophiliaA: 'Hemophilia A',
  warfarin: 'Warfarin',
  liverDisease: 'Liver disease',
  dic: 'DIC',
  vonWillebrand: 'von Willebrand',
  heparin: 'Heparin',
  thrombocytopenia: 'Thrombocytopenia',
};

export const PRESET_ORDER: CoagPresetName[] = [
  'normal',
  'hemophiliaA',
  'warfarin',
  'liverDisease',
  'dic',
  'vonWillebrand',
  'heparin',
  'thrombocytopenia',
];
