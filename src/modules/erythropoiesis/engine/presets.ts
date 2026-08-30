import type { ErythroInputs } from './types';

export const DEFAULT_ERYTHRO_INPUTS: ErythroInputs = {
  renalFunction: 1,
  ironAvailability: 100,
  b12FolateStatus: 100,
  marrowFunction: 1,
  bloodLossRate: 0,
  hemolysisRate: 0,
  inspiredOxygen: 100,
  inflammationLevelPct: 0,
  liverSyntheticFunctionPct: 100,
  erythropoieticDriveMultiplier: 1,
  ironSensingIntegrityPct: 100,
};

export type ErythroPresetName =
  | 'normal'
  | 'ironDeficiency'
  | 'b12FolateDeficiency'
  | 'anemiaOfCkd'
  | 'hemolyticAnemia'
  | 'chronicBloodLoss'
  | 'highAltitude'
  | 'aplasticAnemia'
  | 'anaemiaChronicDisease'
  | 'ironDeficientAndInflamed'
  | 'haemochromatosis'
  | 'erythropoieticDriveHigh';

/**
 * The presets are chosen so that MCV and the reticulocyte index between them separate every
 * case — which is exactly how an anemia is worked up in practice.
 */
export const ERYTHRO_PRESETS: Record<ErythroPresetName, Partial<ErythroInputs>> = {
  normal: { ...DEFAULT_ERYTHRO_INPUTS },
  // Small cells, empty stores, and a marrow that cannot respond for want of raw material.
  ironDeficiency: { ...DEFAULT_ERYTHRO_INPUTS, ironAvailability: 8 },
  // Large cells: DNA synthesis stalls while the cytoplasm matures on schedule.
  b12FolateDeficiency: { ...DEFAULT_ERYTHRO_INPUTS, b12FolateStatus: 8 },
  // Normal-sized cells and a perfectly capable marrow — it simply never receives the EPO
  // signal, because the failing kidney is the organ that makes it.
  anemiaOfCkd: { ...DEFAULT_ERYTHRO_INPUTS, renalFunction: 0.12 },
  // Destruction, not production failure: the marrow responds vigorously, so the retic index
  // is HIGH despite the anemia. That is the fork that separates it from everything above.
  hemolyticAnemia: { ...DEFAULT_ERYTHRO_INPUTS, hemolysisRate: 60 },
  // Ongoing loss drains iron stores over time, so this eventually becomes microcytic too —
  // watch the MCV drift down as the stores empty.
  chronicBloodLoss: { ...DEFAULT_ERYTHRO_INPUTS, bloodLossRate: 42 },
  // Not a disease: low inspired oxygen is sensed as hypoxia at a normal haemoglobin, driving
  // EPO and raising the red cell mass until delivery is restored.
  highAltitude: { ...DEFAULT_ERYTHRO_INPUTS, inspiredOxygen: 62 },
  // The marrow itself is gone, so nothing can respond no matter how high the EPO climbs.
  aplasticAnemia: { ...DEFAULT_ERYTHRO_INPUTS, marrowFunction: 0.08 },
  // Rheumatoid-style inflammation: hepcidin slams ferroportin shut, transferrin falls as a
  // negative acute-phase reactant, ferritin rises — and stores never leave the body.
  anaemiaChronicDisease: { ...DEFAULT_ERYTHRO_INPUTS, inflammationLevelPct: 80 },
  // The trap: genuinely empty-ish stores behind an acute-phase veil that reads a normal ferritin.
  // Ordinary diet but slow losses — the stores drain over weeks rather than collapsing outright.
  ironDeficientAndInflamed: {
    ...DEFAULT_ERYTHRO_INPUTS,
    bloodLossRate: 8,
    inflammationLevelPct: 55,
  },
  // HFE-type sensing failure: hepcidin inappropriately low however full the stores, so
  // absorption keeps running and saturation climbs past forty-five.
  haemochromatosis: { ...DEFAULT_ERYTHRO_INPUTS, ironAvailability: 145, ironSensingIntegrityPct: 12 },
  // Ineffective erythropoiesis (thalassaemia-intermedia style): erythroferrone suppresses
  // hepcidin despite replete stores, and iron overload arrives without any transfusion.
  erythropoieticDriveHigh: { ...DEFAULT_ERYTHRO_INPUTS, erythropoieticDriveMultiplier: 3, ironAvailability: 120 },
};

export const ERYTHRO_PRESET_LABELS: Record<ErythroPresetName, string> = {
  normal: 'Normal',
  ironDeficiency: 'Iron deficiency',
  b12FolateDeficiency: 'B12 / folate deficiency',
  anemiaOfCkd: 'Anemia of CKD',
  hemolyticAnemia: 'Hemolytic anemia',
  chronicBloodLoss: 'Chronic blood loss',
  highAltitude: 'High altitude',
  aplasticAnemia: 'Aplastic anemia',
  anaemiaChronicDisease: 'Anemia of chronic disease',
  ironDeficientAndInflamed: 'Iron deficient and inflamed',
  haemochromatosis: 'Haemochromatosis',
  erythropoieticDriveHigh: 'High erythropoietic drive',
};

export const PRESET_ORDER: ErythroPresetName[] = [
  'normal',
  'ironDeficiency',
  'b12FolateDeficiency',
  'anemiaOfCkd',
  'hemolyticAnemia',
  'chronicBloodLoss',
  'highAltitude',
  'aplasticAnemia',
  'anaemiaChronicDisease',
  'ironDeficientAndInflamed',
  'haemochromatosis',
  'erythropoieticDriveHigh',
];
