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
