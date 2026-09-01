export const FEEDBACK = {
  // T3 is roughly 4x more potent than T4 at hypothalamic/pituitary feedback receptors.
  T3_POTENCY_MULTIPLIER: 4,
};

export const TRH = {
  BASAL_DRIVE: 0.3,
  // Target for the combined T4+T3-equivalent feedback signal (see feedbackSignal() in trh.ts) —
  // roughly T4(8) + T3-in-T4-units(96/3=32) at a healthy baseline, not a literal T4 µg/dL value.
  FEEDBACK_SETPOINT: 40,
  FEEDBACK_SENSITIVITY: 40,
  // Fastest actuator: hypothalamic response.
  TAU_SECONDS: 15,
};

export const TSH = {
  TRH_GAIN: 1.0,
  FEEDBACK_SETPOINT: 40,
  FEEDBACK_SENSITIVITY: 25,
  // Medium: pituitary thyrotroph response.
  TAU_SECONDS: 35,
};

/**
 * The TSH assay value, mIU/L, from the log-linear relation between TSH and thyroid hormone.
 *
 * `tshLevel` above is the thyrotroph DRIVE, a 0-1 actuator that sets thyroid output. It is not an
 * assay result, and expressing the module's single most-used clinical number as a percentage meant
 * the one relation every clinician relies on — that TSH moves LOG-linearly against free T4, so a
 * small hormone change is a large TSH change — could not be read off the screen or asserted in a
 * test. "Graves TSH < 0.05" is meaningless on a 0-1 scale.
 *
 * log10(TSH) = A - B x T4, gated by pituitary thyrotroph function. Calibrated on three clinical
 * landmarks and checked against a fourth:
 *   - euthyroid T4 7.9 ug/dL  -> 1.5 mIU/L   (mid reference range)
 *   - Graves    T4 14.8       -> 0.03        (suppressed below the assay's reporting floor)
 *   - primary hypothyroid T4 4.3 -> 11       (overt, in the 10-100 band)
 *   - secondary hypothyroid, the same T4 4.3 with a failing pituitary -> ~1.7, INAPPROPRIATELY
 *     NORMAL for that T4, which is the textbook finding and the whole discrimination this
 *     module exists to teach.
 */
export const TSH_ASSAY = {
  LOG_INTERCEPT: 2.095,
  LOG_SLOPE_PER_UGDL: 0.2445,
  /** Reporting floor and ceiling of a third-generation assay, mIU/L. */
  MIN_MIU_L: 0.005,
  MAX_MIU_L: 150,
};

export const T4 = {
  BASAL_UGDL: 1.6,
  TSH_GAIN_UGDL: 18,
  MIN_UGDL: 0.5,
  MAX_UGDL: 30,
  EXOGENOUS_GAIN_UGDL_PER_UNIT: 0.05,
  // Slowest actuator in the app — reflects T4's ~7-day half-life vs. cortisol's ~90 minutes.
  TAU_SECONDS: 240,
};

export const AUTONOMOUS_THYROID = {
  GAIN_UGDL_PER_UNIT: 0.22,
};

export const CONVERSION = {
  // Normalized T4->T3 ratio, calibrated so baseline T4~8 -> T3~96 (ng/dL-equivalent normal range).
  T4_TO_T3_BASELINE_RATIO: 12,
  // illnessSeverity=100 (or a full acute bolus) cuts conversion efficiency by up to 70%.
  ILLNESS_SUPPRESSION_GAIN: 0.7,
  MIN_EFFICIENCY: 0.2,
};

export const ACUTE_ILLNESS = {
  DEFAULT_MAGNITUDE: 0.6,
  RECOVERY_TAU_SECONDS: 120,
};

export const HPT_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 6,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 3600,
};
