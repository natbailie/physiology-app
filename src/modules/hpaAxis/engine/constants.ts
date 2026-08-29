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
