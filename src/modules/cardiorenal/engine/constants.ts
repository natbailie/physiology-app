export const HEMODYNAMICS = {
  BASELINE_STROKE_VOLUME_ML: 70,
  BASELINE_HEART_RATE: 70,
  // CO_BASELINE = 70 bpm * 70 mL = 4900 mL/min ~= 4.9 L/min, a normal resting cardiac output.
  get CO_BASELINE_ML_PER_MIN() {
    return HEMODYNAMICS.BASELINE_HEART_RATE * HEMODYNAMICS.BASELINE_STROKE_VOLUME_ML;
  },
  MAP_SETPOINT: 93,
  MIN_EFFECTIVE_SVR: 0.1,
  HEART_RATE_MIN: 40,
  HEART_RATE_MAX: 180,
};

export const STARLING = {
  // Blood volume % at which preload benefit peaks.
  BV_OPTIMAL_PCT: 120,
  // Below this, preload factor scales roughly linearly down to 0 at BV=0.
  BV_BASELINE_PCT: 100,
  // Above this volume, an overloaded/failing heart starts to decompensate (preload factor falls).
  DECOMPENSATION_START_PCT: 150,
  // How much contractility must be preserved to resist decompensation at high volume.
  DECOMPENSATION_CONTRACTILITY_THRESHOLD: 0.6,
  MAX_PRELOAD_FACTOR: 1.3,
  MIN_PRELOAD_FACTOR: 0.05,
};

export const BAROREFLEX = {
  // MAP deviation (mmHg) that saturates the reflex drive at +/-1.
  SENSITIVITY_RANGE: 40,
  MAX_HEART_RATE_ADJUST: 30,
  MAX_TONE_ADJUST: 0.3,
  // Fast: seconds-scale reflex.
  TAU_SECONDS: 8,
};

export const RAAS = {
  MAP_SENSITIVITY: 35,
  GFR_SENSITIVITY: 60,
  ANP_SUPPRESSION_GAIN: 0.6,
  ANGIOTENSIN_TONE_GAIN: 0.35,
  ANGIOTENSIN_EFFERENT_FF_GAIN: 0.12,
  ALDOSTERONE_REABSORPTION_GAIN: 0.12,
  // Slowest: full activation takes minutes, unlike the fast baroreflex.
  TAU_SECONDS: 240,
};

export const ANP = {
  // Preload factor above which atrial stretch triggers ANP release.
  PRELOAD_THRESHOLD: 1.05,
  SENSITIVITY: 0.35,
  TONE_RELIEF_GAIN: 0.15,
  NATRIURESIS_GAIN: 0.1,
  // Intermediate: faster than RAAS, slower than the baroreflex.
  TAU_SECONDS: 45,
};

export const RENAL = {
  AUTOREG_LOW_MAP: 70,
  AUTOREG_HIGH_MAP: 150,
  AUTOREG_FLOOR_MAP: 20,
  AUTOREG_CEILING_MAP: 220,
  AUTOREG_BREAKTHROUGH_MAX: 1.25,
  BASE_FILTRATION_FRACTION: 0.2,
  MAX_FILTRATION_FRACTION: 0.35,
  BASELINE_GFR: 100,
  REABSORPTION_BASELINE: 0.85,
  REABSORPTION_MAX: 0.995,
  // Target urine output at baseline steady state (matches default sodiumIntake=100).
  BASELINE_URINE_TARGET: 100,
};

export const SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  // %BV change per (unit fluid imbalance * second).
  BLOOD_VOLUME_GAIN: 0.00033,
  BLOOD_VOLUME_MIN_PCT: 10,
  BLOOD_VOLUME_MAX_PCT: 250,
  HEMORRHAGE_BV_MULTIPLIER: 0.7,
  // Applied to real elapsed time in the React loop (not inside the pure engine) so a
  // multi-minute RAAS response is watchable within roughly a real minute.
  TIME_SCALE: 6,
  /** Simulated seconds of settling applied before the first frame — and, through `reset`, before
   * a scenario button's first frame. A salt load reaches the blood volume only through the
   * fluid-balance integrator, so without this the button changed nothing you could see for
   * minutes of real time; 300s is enough to show the volume expansion without
   * driving it to a place no patient would be in. */
  SETTLE_SECONDS: 300,
};
