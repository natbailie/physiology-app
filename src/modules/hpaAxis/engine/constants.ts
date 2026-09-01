export const CIRCADIAN = {
  // One simulated "day" completes in 240s of engine time — with TIME_SCALE=6 and typical
  // real-world play, that's watchable within a few real minutes.
  PERIOD_SECONDS: 240,
  AMPLITUDE: 0.3,
  // Cortisol/CRH drive peaks ~1/3 through the cycle ("early morning" cortisol surge).
  PEAK_PHASE_FRACTION: 0.33,
};

export const CRH = {
  STRESS_GAIN: 0.01,
  FEEDBACK_SETPOINT_UGDL: 12,
  FEEDBACK_SENSITIVITY_UGDL: 15,
  // Fastest actuator: hypothalamic response.
  TAU_SECONDS: 12,
};

export const ACTH = {
  CRH_GAIN: 1.0,
  // Pituitary is the physiologically dominant negative-feedback site — tighter sensitivity than CRH's.
  FEEDBACK_SETPOINT_UGDL: 12,
  FEEDBACK_SENSITIVITY_UGDL: 12,
  // Medium: pituitary corticotroph response.
  TAU_SECONDS: 30,
};

/**
 * The ACTH assay value, pg/mL, from the corticotroph drive.
 *
 * `acthLevel` is a 0-1 actuator. ACTH is also the single measurement that separates a failed
 * ADRENAL from a failed PITUITARY — both present with a low cortisol, and only the ACTH tells them
 * apart — so expressing it as a percentage left the module's central discrimination dimensionless.
 *
 * The map is logarithmic because ACTH spans two and a half decades across the states this module
 * ships, and because the drive already carries both the cortisol feedback and the pituitary gate.
 * Calibrated on the normal range and on Addison's, and the other three fall where they should:
 *   - normal        drive 0.61 -> 25 pg/mL   (reference range 10-60)
 *   - Addison's     drive 1.00 -> ~250       (primary failure: the pituitary is shouting)
 *   - secondary     drive 0.10 -> ~1.2       (the pituitary is the thing that failed)
 *   - steroids      drive 0.29 -> ~3.6       (exogenous suppression)
 *   - adrenal adenoma drive 0.00 -> ~0.7     (autonomous cortisol, axis switched off)
 */
export const ACTH_ASSAY = {
  LOG_INTERCEPT: -0.184,
  LOG_SLOPE_PER_DRIVE: 2.584,
  /** Assay reporting floor and a ceiling above the highest ectopic values, pg/mL. */
  MIN_PG_ML: 0.5,
  MAX_PG_ML: 2000,
};

export const CORTISOL = {
  BASAL_UGDL: 2.4,
  ACTH_GAIN_UGDL: 20,
  MIN_UGDL: 0.5,
  MAX_UGDL: 60,
  // Exogenous glucocorticoid's contribution to the cortisol-equivalent reading/feedback signal.
  EXOGENOUS_EQUIVALENCE_GAIN: 0.06,
  // Slowest of the cascade actuators: adrenal steroidogenesis.
  TAU_SECONDS: 90,
};

export const AUTONOMOUS_ADRENAL = {
  GAIN_UGDL_PER_UNIT: 0.25,
};

export const ADRENAL_RESERVE = {
  // exogenousGlucocorticoid above this triggers ACTH suppression severe enough to atrophy the gland.
  SUPPRESSION_THRESHOLD: 50,
  ATROPHY_GAIN_PER_SECOND: 0.0000002,
  // Recovery deliberately slower than atrophy — mirrors real clinical caution around steroid tapering.
  RECOVERY_GAIN_PER_SECOND: 0.00015,
  MIN: 0.05,
};

export const ACUTE_STRESSOR = {
  DEFAULT_MAGNITUDE: 0.7,
  RECOVERY_TAU_SECONDS: 60,
};

export const HPA_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 6,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 480,
};
