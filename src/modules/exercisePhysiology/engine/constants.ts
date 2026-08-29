/** Calibrated so a resting adult sits at VO2 ~250 mL/min, HR ~72, CO ~5 L/min and lactate
 * ~1.2 mmol/L; an untrained subject hits their ceiling near 230 W while an elite rides past
 * 350 W with lactate barely moved. */

export const OXYGEN = {
  REST_VO2_ML_MIN: 250,
  /** Cycling ergometry: roughly 10.5 mL O2 per minute per watt above rest. */
  ML_PER_WATT: 10.5,
  VO2_TAU_SECONDS: 90,
} as const;

export const CARDIO = {
  MAX_HR_FORMULA_OFFSET: 220,
  REST_HR_BASE_BPM: 72,
  TRAINED_REST_HR_REDUCTION_PER_UNIT: 0.27,
  MIN_REST_HR_BPM: 42,
  SV_REST_ML_PER_FITNESS_UNIT: 70,
  SV_TRAINING_ML_PER_UNIT: 0.45,
  SV_RISE_MAX_PCT: 35,
  HR_TAU_SECONDS: 45,
  SV_TAU_SECONDS: 120,
} as const;

export const LACTATE = {
  BASE_MMOL_L: 1.2,
  THRESHOLD_FRACTION_BASE: 0.52,
  THRESHOLD_SHIFT_PER_FITNESS_UNIT: 0.0028,
  SLOPE_GAIN: 6,
  STEEPNESS_GAIN: 8,
  TAU_SECONDS: 700,
} as const;

export const VENTILATION = {
  BASE_L_MIN: 2.5,
  L_PER_VO2: 0.021,
  EXTRA_PER_LACTATE_ABOVE_4: 3.5,
  TAU_SECONDS: 60,
} as const;

export const FATIGUE = {
  ACCUMULATION_PER_EXCESS: 12,
  DECAY_TAU_SECONDS: 900000,
  MAX_PCT: 100,
} as const;

export const THERMOSTRAIN = {
  CORE_DRIFT_MAX_C: 1.4,
  DEHYDRATION_PENALTY_PER_PCT: 0.011,
  CORE_TAU_SECONDS: 1800,
} as const;

export const EXERCISE_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 700,
  /** Responses settle over minutes; compressed so long efforts stay watchable. */
  TIME_SCALE: 60,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 720,
} as const;
