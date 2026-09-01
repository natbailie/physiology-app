export interface HptInputs {
  /** Thyroid gland's capacity to synthesize/secrete T4 in response to TSH, fraction (0-1.5) —
   * low models primary hypothyroidism (Hashimoto's, iodine deficiency) */
  thyroidGlandFunction: number;
  /** Anterior pituitary thyrotroph capacity, fraction (0-1.5) — low models secondary
   * hypothyroidism (pituitary failure) */
  pituitaryTshFunction: number;
  /** TSH-receptor autonomous stimulation — models Graves' disease / a toxic nodule (0-100) */
  autonomousThyroidStimulation: number;
  /** Exogenous levothyroxine dose, % of a standard replacement/suppressive dose (0-300) */
  exogenousLevothyroxine: number;
  /** Acute illness/starvation severity suppressing peripheral T4→T3 conversion — models
   * sick euthyroid syndrome / non-thyroidal illness (0-100) */
  illnessSeverity: number;
}

export interface HptState {
  simTimeSeconds: number;
  /** Fastest actuator: hypothalamic TRH drive, 0..1 */
  trhDrive: number;
  /** Medium actuator: pituitary TSH level, 0..1, gated by pituitaryTshFunction */
  tshLevel: number;
  /** Slowest actuator: plasma total T4, µg/dL — reflects T4's much longer half-life than cortisol */
  t4Level: number;
  /** Transient perturbation state: an acute illness event, decays to 0 */
  acuteIllnessBolus: number;
}

export interface HptDerived {
  trhDrive: number;
  /** Thyrotroph DRIVE, 0-1 — the internal actuator that sets thyroid output. The number a
   * clinician reads is `tshMilliUnitsPerL`. */
  tshLevel: number;
  /** TSH as an assay reports it, mIU/L. Reference range 0.4-4.0. */
  tshMilliUnitsPerL: number;
  t4Level: number;
  t3Level: number;
  conversionEfficiency: number;
  acuteIllnessBolus: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  thyroidGlandFunction: number;
  pituitaryTshFunction: number;
  autonomousThyroidStimulation: number;
  exogenousLevothyroxine: number;
  illnessSeverity: number;
}

export interface HptSnapshot {
  state: HptState;
  derived: HptDerived;
}

export interface HptHistoryPoint {
  t: number;
  tsh: number;
  t4: number;
  t3: number;
}
