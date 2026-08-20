export type AdhMode = 'regulated' | 'inappropriate' | 'deficient';
export type ExtrarenalLoss = 'none' | 'vomiting' | 'diarrhoea' | 'sweating';
export type Diuretic = 'none' | 'loop' | 'thiazide' | 'potassiumSparing';
export type Infusion = 'none' | 'normalSaline' | 'hypertonic3' | 'dextrose5' | 'potassiumReplacement';

export type VolumeStatus = 'hypovolemic' | 'euvolemic' | 'hypervolemic';
export type Tonicity = 'hypotonic' | 'isotonic' | 'hypertonic';

export interface ElectrolyteInputs {
  /** Dietary sodium, mEq/day (0-400; a typical Western diet is ~150). */
  sodiumIntake: number;
  /** Dietary potassium, mEq/day (0-200; typical ~70). */
  potassiumIntake: number;
  /** Water taken by mouth, L/day (0-12), before thirst adds any more. */
  waterIntake: number;
  /** Insulin, multiple of normal (0-5). Drives potassium INTO cells via the Na+/K+-ATPase
   * without changing total body potassium at all — the single most important idea here. */
  insulinLevel: number;
  /** Beta-2 adrenergic activity, multiple of normal (0-3). Salbutamol works the same way. */
  beta2Activity: number;
  /** Arterial pH (6.9-7.6). Acidaemia drives potassium out of cells in exchange for hydrogen
   * ions, and simultaneously reduces distal potassium secretion. */
  arterialPH: number;
  /** Mineralocorticoid drive, multiple of normal (0-3). 0 is Addison's or spironolactone;
   * 3 is Conn's syndrome. */
  aldosteroneDrive: number;
  /** Glomerular filtration rate as a fraction of normal (0.05-1.2). Potassium excretion
   * depends on it, which is why advanced CKD is the commonest cause of hyperkalaemia. */
  gfrFraction: number;
  /** Serum glucose, mg/dL (70-800) — an effective osmole. Hyperglycaemia pulls water out of
   * cells and dilutes serum sodium without anything being wrong with sodium at all. */
  serumGlucoseMgDl: number;
  /** How ADH is being secreted: normally regulated, inappropriately fixed high (SIADH), or
   * absent (diabetes insipidus). */
  adhMode: AdhMode;
  /** Ongoing non-renal fluid loss. Each has a different sodium and potassium signature, which
   * is what decides whether the patient ends up hypo- or hypernatraemic. */
  extrarenalLoss: ExtrarenalLoss;
  diuretic: Diuretic;
  /** Treatment being infused. */
  infusion: Infusion;
}

export interface ElectrolyteState {
  simTimeSeconds: number;
  /** Total exchangeable sodium, mEq. Sodium is the ECF cation, so this sets ECF SIZE. */
  exchangeableSodiumMeq: number;
  /** Total body (exchangeable) potassium, mEq — about 98% of it inside cells. This is the
   * quantity that gains and loses potassium; the serum level is only a window onto it. */
  exchangeablePotassiumMeq: number;
  /** The ECF share of that potassium, mEq. Serum potassium is this divided by ECF volume, so
   * it can move dramatically with no change in total body potassium whatsoever. */
  ecfPotassiumMeq: number;
  /** Total body water, L. Water sets CONCENTRATION, which is why serum sodium is a water
   * measurement rather than a salt measurement. */
  totalBodyWaterL: number;
  /** Smoothed actuators, staged fast to slow: the transcellular shift is fastest (minutes),
   * then ADH (tens of minutes), then thirst, then aldosterone (hours). */
  adhLevel: number;
  aldosteroneLevel: number;
  thirstDrive: number;
  /** Smoothed rate of change of serum sodium, mEq/L/day — the number that decides whether a
   * correction is safe, not the sodium itself. */
  sodiumChangeRateMeqLPerDay: number;
  /** The sodium the brain has adapted its osmolyte content to, lagging the serum level by about
   * a day and a half. The gap between this and the actual sodium is the osmotic stress. */
  adaptedSodiumMeqL: number;
}

export interface ElectrolyteDerived {
  serumSodiumMeqL: number;
  serumPotassiumMeqL: number;
  /** What the sodium would be if glucose were normal — the hyperglycaemia correction. */
  correctedSodiumMeqL: number;
  serumOsmolality: number;
  /** Tonicity: only the osmoles that cannot cross cell membranes. Urea raises measured
   * osmolality but pulls no water, so it does not count. */
  effectiveOsmolality: number;
  tonicity: Tonicity;
  ecfVolumeL: number;
  icfVolumeL: number;
  totalBodyWaterL: number;
  ecfVolumeStatus: VolumeStatus;
  /** Fraction of total body potassium sitting in the ECF — normally about 1.4%. */
  ecfPotassiumFraction: number;
  totalBodyPotassiumMeq: number;
  /** Net potassium flux across cell membranes, mEq/day. Positive = into cells. */
  transcellularShiftMeqPerDay: number;
  adhLevel: number;
  aldosteroneLevel: number;
  thirstDrive: number;
  urineOsmolality: number;
  urineVolumeLPerDay: number;
  /** Free water clearance, L/day. Negative means the kidney is retaining free water — the
   * finding that defines SIADH. */
  freeWaterClearanceLPerDay: number;
  sodiumExcretionMeqPerDay: number;
  potassiumExcretionMeqPerDay: number;
  /** Transtubular potassium gradient — is the kidney secreting potassium appropriately for
   * this serum level, or is it the cause of the problem? */
  transtubularKGradient: number;
  sodiumChangeRateMeqLPerDay: number;
  adaptedSodiumMeqL: number;
  /** 0-1 severity of the risk of osmotic demyelination from correcting sodium too fast. */
  demyelinationRisk: number;
  /** What this potassium level would be doing to the ECG. */
  ecgRisk: string;
  /** The bedside algorithm, run automatically: tonicity, then volume status, then urine. */
  disorderClassification: string;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  sodiumIntake: number;
  potassiumIntake: number;
  waterIntake: number;
  insulinLevel: number;
  beta2Activity: number;
  arterialPH: number;
  aldosteroneDrive: number;
  gfrFraction: number;
  serumGlucoseMgDl: number;
  adhMode: AdhMode;
  extrarenalLoss: ExtrarenalLoss;
  diuretic: Diuretic;
  infusion: Infusion;
}

export interface ElectrolyteSnapshot {
  state: ElectrolyteState;
  derived: ElectrolyteDerived;
}

export interface ElectrolyteHistoryPoint {
  t: number;
  sodium: number;
  potassium: number;
  /** Total body potassium expressed as a percentage of normal, so it can be plotted on the
   * same axis as serum potassium and the divergence between them can be seen directly. */
  totalBodyPotassiumPct: number;
  ecfVolume: number;
}
