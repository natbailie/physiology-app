/** One station along the unrolled nephron, used to plot osmolality against tubule position. */
export interface NephronSegment {
  label: string;
  /** Tubular fluid osmolality at the END of this segment, mOsm/kg */
  osmolality: number;
  /** Fraction of the originally filtered volume still in the tubule at the end of this segment */
  flowFraction: number;
}

export interface RenalTubularInputs {
  /** Glomerular filtration rate, mL/min (20-180) — module-local, independent of the
   * cardiorenal module's whole-body kidneyFunction input */
  gfrMLPerMin: number;
  /** Water intake, % of baseline (0-300) — drives plasma osmolality, which is what the
   * osmoreceptors actually sense, so the ADH loop stays genuinely closed */
  waterIntakeRate: number;
  /** Posterior pituitary ADH secretory capacity, fraction (0-1.5) — low models CENTRAL
   * diabetes insipidus, which still responds to exogenous ADH */
  adhSecretionCapacity: number;
  /** Collecting-duct responsiveness to ADH, fraction (0-1.5) — low models NEPHROGENIC
   * diabetes insipidus, which does NOT respond to exogenous ADH */
  collectingDuctADHSensitivity: number;
  /** Exogenous ADH (desmopressin/DDAVP), % of a standard dose (0-150) — the water
   * deprivation test's differentiating step between the two types of DI */
  exogenousADH: number;
  /** Loop diuretic dose, % (0-100) — blocks NKCC2 in the thick ascending limb, which both
   * dumps NaCl and washes out the medullary gradient */
  loopDiureticDose: number;
  /** Thiazide dose, % (0-100) — blocks the distal NaCl cotransporter, a milder natriuresis
   * that spares the medullary gradient */
  thiazideDose: number;
  /** Tubuloglomerular feedback strength, fraction (0-1.5) */
  maculaDensaFeedbackStrength: number;
}

export interface RenalTubularState {
  simTimeSeconds: number;
  /** Plasma osmolality, mOsm/kg (the plant variable the osmoreceptors sense) */
  plasmaOsmolality: number;
  /** Medullary interstitial gradient strength, 0..1 — genuinely dynamic: it is BUILT by thick
   * ascending limb pumping and WASHED OUT when that pumping is blocked */
  medullaryGradientStrength: number;
  /** Smoothed ADH level, 0..1 */
  adhLevel: number;
  /** Smoothed afferent arteriolar tone from tubuloglomerular feedback, 0..1 */
  afferentToneFromTGF: number;
}

export interface RenalTubularDerived {
  plasmaOsmolality: number;
  medullaryGradientStrength: number;
  adhLevel: number;
  /** Total ADH effect at the collecting duct, combining endogenous and exogenous, after the
   * receptor-sensitivity gate — this is what actually sets water permeability */
  effectiveADHAction: number;
  afferentToneFromTGF: number;
  /** GFR after tubuloglomerular autoregulation, mL/min */
  gfrAfterTGF: number;
  segments: NephronSegment[];
  finalUrineOsmolality: number;
  urineFlowRateMLPerMin: number;
  /** Free water clearance, mL/min: CH2O = V − Cosm. Positive = excreting dilute urine
   * (shedding free water), negative = concentrating (retaining free water) */
  freeWaterClearance: number;
  /** Fractional NaCl delivery to the macula densa — the TGF sensing signal */
  distalNaClDelivery: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  waterIntakeRate: number;
  adhSecretionCapacity: number;
  collectingDuctADHSensitivity: number;
  exogenousADH: number;
  loopDiureticDose: number;
  thiazideDose: number;
  maculaDensaFeedbackStrength: number;
}

export interface RenalTubularSnapshot {
  state: RenalTubularState;
  derived: RenalTubularDerived;
}

export interface RenalTubularHistoryPoint {
  t: number;
  plasmaOsmolality: number;
  urineOsmolality: number;
  adhLevel: number;
}
