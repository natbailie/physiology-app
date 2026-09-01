export interface HpaInputs {
  /** Acute physical/psychological stressor driving CRH release (0-100) */
  acuteStressLevel: number;
  /** Exogenous glucocorticoid dose (prednisone-equivalent), % of a standard suppressive dose (0-300) */
  exogenousGlucocorticoid: number;
  /** Anterior pituitary corticotroph capacity, fraction (0-1.5) — low models secondary adrenal
   * insufficiency (e.g. pituitary failure) */
  pituitaryFunction: number;
  /** Adrenal cortex responsiveness to ACTH, fraction (0-1.5) — low models primary adrenal
   * insufficiency (Addison's disease) */
  adrenalCortexFunction: number;
  /** ACTH-independent (autonomous) cortisol secretion — models a cortisol-producing adrenal
   * adenoma (0-100) */
  autonomousAdrenalSecretion: number;
}

export interface HpaState {
  simTimeSeconds: number;
  /** Fastest actuator: hypothalamic CRH drive, 0..1 */
  crhDrive: number;
  /** Medium actuator: pituitary ACTH level, 0..1, gated by pituitaryFunction */
  acthLevel: number;
  /** Slowest cascade actuator: plasma cortisol, µg/dL */
  cortisolLevel: number;
  /** Persistent "plant"-like state: adrenal functional reserve, 0..1 (starts at 1) — depletes
   * under sustained ACTH suppression (steroid-induced atrophy), recovers slowly once lifted */
  adrenalReserve: number;
  /** Transient perturbation state: an acute stressor event, decays to 0 */
  acuteStressBolus: number;
}

export interface HpaDerived {
  /** ACTH as an assay reports it, pg/mL. Reference range 10-60. */
  acthPgPerML: number;
  crhDrive: number;
  acthLevel: number;
  cortisolLevel: number;
  adrenalReserve: number;
  acuteStressBolus: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  pituitaryFunction: number;
  adrenalCortexFunction: number;
  autonomousAdrenalSecretion: number;
  exogenousGlucocorticoid: number;
  acuteStressLevel: number;
}

export interface HpaSnapshot {
  state: HpaState;
  derived: HpaDerived;
}

export interface HpaHistoryPoint {
  t: number;
  cortisol: number;
  acth: number;
  adrenalReserve: number;
}
