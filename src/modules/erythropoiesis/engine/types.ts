export type AnemiaClassification =
  | 'normal'
  | 'microcytic anemia'
  | 'normocytic anemia'
  | 'macrocytic anemia'
  | 'polycythemia';

export interface ErythroInputs {
  /** Renal function, fraction (0-1.5) — the kidney senses tissue oxygen and makes EPO, so
   * chronic kidney disease causes anemia by hormone deficiency rather than marrow failure */
  renalFunction: number;
  /** Iron availability, % of normal (0-150) — gates haem synthesis; deficiency makes cells small */
  ironAvailability: number;
  /** B12 and folate status, % of normal (0-150) — gates DNA synthesis in the precursor, so
   * deficiency makes cells large */
  b12FolateStatus: number;
  /** Marrow erythroid capacity, fraction (0-1.5) — low models aplastic anemia or infiltration */
  marrowFunction: number;
  /** Chronic blood loss, % where 0 is none (0-100) */
  bloodLossRate: number;
  /** Red cell destruction above the normal rate, % (0-100) — haemolysis */
  hemolysisRate: number;
  /** Inspired oxygen, % of sea-level normal (40-150) — low models altitude, the physiological
   * stimulus to erythropoiesis */
  inspiredOxygen: number;
  /** Inflammation (IL-6 drive), % (0-100). Multiplies hepcidin several-fold and drops
   * transferrin — the whole anaemia-of-chronic-disease pattern from one lever. */
  inflammationLevelPct: number;
  /** Liver synthetic function, % (0-100). Caps BOTH hepcidin and transferrin production. */
  liverSyntheticFunctionPct: number;
  /** Erythropoietic drive beyond supply, multiple of normal (0.5-3) — erythroferrone-like
   * suppression of hepcidin in ineffective erythropoiesis. */
  erythropoieticDriveMultiplier: number;
  /** Iron-sensing integrity, % (0-100). Low models HFE haemochromatosis: hepcidin
   * inappropriately low however full the stores. */
  ironSensingIntegrityPct: number;
}

export interface ErythroState {
  simTimeSeconds: number;
  /** Haemoglobin, g/dL — the plant variable */
  hemoglobinGDl: number;
  /** Smoothed EPO level, 0..1 */
  epoLevel: number;
  /** Smoothed marrow erythroid output, 0..1 */
  marrowOutput: number;
  /** Iron stores as ferritin-equivalent, 0..1 — depleted by chronic loss */
  ironStores: number;
  /** Mean corpuscular volume of cells currently being produced, fL. Tracked separately from
   * the circulating average because a change in substrate only affects NEW cells. */
  producedMcv: number;
  /** Circulating mean corpuscular volume, fL — lags the produced value as the population turns over */
  circulatingMcv: number;
  /** Smoothed hepcidin level, fraction of normal (1 = healthy baseline). */
  hepcidinFraction: number;
}

export interface ErythroDerived {
  hemoglobinGDl: number;
  hematocritPercent: number;
  /** Mean corpuscular volume, fL — the classifier that splits anemia three ways */
  mcv: number;
  /**
   * Reticulocyte production index. The single most useful discriminator: it separates a marrow
   * that CANNOT respond from one that is responding hard but losing cells faster than it can
   * replace them.
   */
  reticulocyteIndex: number;
  epoLevel: number;
  marrowOutput: number;
  ferritinNgMl: number;

  // The iron studies panel — every row downstream of one hormone.
  /** Hepcidin, fraction of normal (1 = healthy baseline). */
  hepcidinFraction: number;
  serumIronUgDl: number;
  tibcUgDl: number;
  transferrinSaturationPct: number;
  /** Ferroportin abundance relative to normal — how open the iron export door is. */
  ferroportinGateFraction: number;
  /** Oxygen delivery, mL/min — Hb × 1.34 × SaO2 × cardiac output */
  oxygenDeliveryMlPerMin: number;
  /** How hypoxic the renal sensor currently is, 0..1 */
  tissueHypoxia: number;
  anemiaClassification: AnemiaClassification;
  isHypoproliferative: boolean;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  renalFunction: number;
  ironAvailability: number;
  b12FolateStatus: number;
  marrowFunction: number;
  bloodLossRate: number;
  hemolysisRate: number;
  inspiredOxygen: number;
  inflammationLevelPct: number;
  liverSyntheticFunctionPct: number;
  erythropoieticDriveMultiplier: number;
  ironSensingIntegrityPct: number;
}

export interface ErythroSnapshot {
  state: ErythroState;
  derived: ErythroDerived;
}

export interface ErythroHistoryPoint {
  t: number;
  hemoglobin: number;
  epo: number;
  reticulocyteIndex: number;
}
