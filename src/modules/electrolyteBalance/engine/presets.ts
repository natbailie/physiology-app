import type { ElectrolyteInputs } from './types';

export const DEFAULT_ELECTROLYTE_INPUTS: ElectrolyteInputs = {
  sodiumIntake: 150,
  potassiumIntake: 70,
  waterIntake: 2,
  insulinLevel: 1,
  beta2Activity: 1,
  arterialPH: 7.4,
  aldosteroneDrive: 1,
  gfrFraction: 1,
  serumGlucoseMgDl: 90,
  adhMode: 'regulated',
  extrarenalLoss: 'none',
  diuretic: 'none',
  infusion: 'none',
};

export type ElectrolytePresetName =
  | 'normal'
  | 'dka'
  | 'ckdHyperkalemia'
  | 'loopDiuretic'
  | 'vomiting'
  | 'siadh'
  | 'hypovolemicHyponatremia'
  | 'polydipsia'
  | 'hyperaldosteronism'
  | 'diabetesInsipidus';

export const ELECTROLYTE_PRESETS: Record<ElectrolytePresetName, Partial<ElectrolyteInputs>> = {
  normal: { ...DEFAULT_ELECTROLYTE_INPUTS },
  // The most instructive scenario in the module. Insulin deficiency and acidaemia have pushed
  // potassium OUT of cells, so the serum level reads high or normal while osmotic diuresis has
  // stripped total body potassium bare. Give insulin — the "Give insulin" action — and the
  // serum level collapses, because the number was never measuring the deficit.
  dka: {
    ...DEFAULT_ELECTROLYTE_INPUTS,
    insulinLevel: 0,
    arterialPH: 7.1,
    serumGlucoseMgDl: 550,
    potassiumIntake: 0,
    waterIntake: 1,
    gfrFraction: 0.6,
  },
  // Advanced CKD: potassium excretion depends on GFR, aldosterone and distal flow together, and
  // here the first has collapsed. Note how long potassium stays normal as GFR falls, and how
  // abruptly it rises at the end.
  ckdHyperkalemia: { ...DEFAULT_ELECTROLYTE_INPUTS, gfrFraction: 0.12, aldosteroneDrive: 0.6, arterialPH: 7.28, potassiumIntake: 55 },
  // Loop diuretic: massive distal sodium and flow delivery, so potassium is secreted into a
  // torrent of tubular fluid. Volume depletion then raises aldosterone, compounding the loss.
  loopDiuretic: { ...DEFAULT_ELECTROLYTE_INPUTS, diuretic: 'loop', potassiumIntake: 40 },
  // Vomiting loses relatively little potassium in the vomitus itself. Most of the deficit is
  // RENAL: the alkalosis and the volume depletion together drive potassium into the urine.
  vomiting: { ...DEFAULT_ELECTROLYTE_INPUTS, extrarenalLoss: 'vomiting', arterialPH: 7.52, potassiumIntake: 20, sodiumIntake: 40 },
  // ADH fixed high regardless of osmolality. Water is retained, sodium falls, the urine stays
  // inappropriately concentrated, and the patient stays euvolaemic throughout — the triad.
  siadh: { ...DEFAULT_ELECTROLYTE_INPUTS, adhMode: 'inappropriate', waterIntake: 2.5 },
  // Here ADH is high for a completely appropriate reason. Volume depletion overrides tonicity,
  // so the kidney keeps retaining water and the sodium falls — and saline, not water
  // restriction, is the treatment. Same low sodium, opposite management.
  hypovolemicHyponatremia: {
    ...DEFAULT_ELECTROLYTE_INPUTS,
    extrarenalLoss: 'diarrhoea',
    sodiumIntake: 20,
    waterIntake: 3,
    arterialPH: 7.28,
  },
  // Intake alone can outrun a normal kidney, but only just: it takes more than about 15 L/day
  // before maximally dilute urine can no longer keep up.
  polydipsia: { ...DEFAULT_ELECTROLYTE_INPUTS, waterIntake: 11 },
  // Conn's syndrome: sodium retention with potassium wasting. Note that the oedema never
  // arrives — aldosterone escape, driven by pressure natriuresis, caps the volume expansion.
  hyperaldosteronism: { ...DEFAULT_ELECTROLYTE_INPUTS, aldosteroneDrive: 3, arterialPH: 7.48 },
  // No ADH at all: enormous volumes of dilute urine. Sodium stays near normal only for as long
  // as thirst can keep pace with the losses.
  diabetesInsipidus: { ...DEFAULT_ELECTROLYTE_INPUTS, adhMode: 'deficient', waterIntake: 2 },
};

export const ELECTROLYTE_PRESET_LABELS: Record<ElectrolytePresetName, string> = {
  normal: 'Normal',
  dka: 'DKA',
  ckdHyperkalemia: 'CKD hyperkalaemia',
  loopDiuretic: 'Loop diuretic',
  vomiting: 'Vomiting',
  siadh: 'SIADH',
  hypovolemicHyponatremia: 'Hypovolaemic hypoNa',
  polydipsia: 'Polydipsia',
  hyperaldosteronism: "Conn's syndrome",
  diabetesInsipidus: 'Diabetes insipidus',
};

export const ELECTROLYTE_PRESET_ORDER: ElectrolytePresetName[] = [
  'normal',
  'dka',
  'ckdHyperkalemia',
  'loopDiuretic',
  'vomiting',
  'hyperaldosteronism',
  'siadh',
  'hypovolemicHyponatremia',
  'polydipsia',
  'diabetesInsipidus',
];
