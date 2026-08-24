export type PregnancyState_Classification =
  | 'first trimester'
  | 'second trimester'
  | 'third trimester'
  | 'term singleton pregnancy'
  | 'twin gestation'
  | 'placental insufficiency: IUGR risk'
  | 'in labour: Ferguson reflex active'
  | 'postpartum: breastfeeding established'
  | 'postpartum: lactation suppressed';

export interface PregnancyInputs {
  /** Gestational age, weeks (4-42). */
  gestationalWeeks: number;
  /** Multiple gestation (twins), 0 or 1. */
  twinGestation: number;
  /** Placental function, % (0-100). Low models pre-eclampsia/IUGR physiology. */
  placentalFunctionPct: number;
  /** Suckling frequency post-delivery, % (0-100). */
  sucklingDrivePct: number;
  /** Delivered (puerperium) mode, 0 or 1. */
  deliveredMode: number;
  /** Haemoglobin before pregnancy, g/dL (9-15). */
  baselineHaemoglobinGPerDl: number;
}

export interface PregnancyInternalState {
  simTimeSeconds: number;
  progesteroneNgMl: number;
  prolactinNgMl: number;
  milkSupplyMlPerDay: number;
  /** Seconds since delivery while in puerperium — drives the no-suckling prolactin decay. */
  postpartumSeconds: number;
  oxytocinLetDownTimerSeconds: number;
  labourActive: boolean;
  cervicalDilationCm: number;
  deliveredOverride: boolean;
}

export interface PregnancyDerived {
  pregnancyProgressFraction: number;
  plasmaVolIncreasePct: number;
  redCellMassIncreasePct: number;
  haemoglobinGPerDl: number;
  cardiacOutputIncreasePct: number;
  svrChangePct: number;
  meanArterialPressureMmHg: number;
  paCO2MmHg: number;
  bicarbonateMmolL: number;
  phArterial: number;
  gfrIncreasePct: number;
  creatinineMgDl: number;
  serumSodiumMmolL: number;
  fetalWeightG: number;
  uteroplacentalFlowSharePct: number;
  progesteroneNgMl: number;
  prolactinNgMl: number;
  oxytocinRelative: number;
  milkSupplyMlPerDay: number;
  cervicalDilationCm: number;
  deliveredEffective: boolean;
  classification: PregnancyState_Classification;
  patternSummary: string;
}

export interface PregnancySnapshot {
  state: PregnancyInternalState;
  derived: PregnancyDerived;
}

export interface PregnancyHistoryPoint {
  t: number;
  hb: number;
  progesterone: number;
  milk: number;
  dilation: number;
}
