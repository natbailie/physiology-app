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
  // Below this, preload factor falls toward 0 at BV=0.
  BV_BASELINE_PCT: 100,
  /**
   * How steeply preload falls BELOW baseline volume, as an exponent on the remaining fraction.
   * 1 is the straight line this used to be.
   *
   * Filling pressure comes from STRESSED volume, and the unstressed compartment does not give up
   * its share when blood is lost — vessels recoil, so the loss comes preferentially out of the part
   * that stretches them. Stroke volume therefore falls faster than volume does. Pulse's baroreflex
   * trace is the measurement: a ~9% loss costs it 24% of stroke volume, where a straight line costs
   * 9% and left our cardiac output falling 2.7% against its 10.4%.
   *
   * `shockStates` corrects the same assumption in its own units — see
   * `CIRCULATION.UNSTRESSED_RECOIL_EXPONENT` there. One mechanism, two modules.
   */
  SUB_BASELINE_EXPONENT: 2.5,
  // Above this volume, an overloaded/failing heart starts to decompensate (preload factor falls).
  DECOMPENSATION_START_PCT: 150,
  // How much contractility must be preserved to resist decompensation at high volume.
  DECOMPENSATION_CONTRACTILITY_THRESHOLD: 0.6,
  MAX_PRELOAD_FACTOR: 1.3,
  MIN_PRELOAD_FACTOR: 0.05,
};

export const BAROREFLEX = {
  /**
   * MAP deviation (mmHg) at which the reflex is working at half its authority.
   *
   * Drive used to be LINEAR in the error and saturate only 40 mmHg from setpoint, which left the
   * reflex almost idle over the range a patient actually occupies: a ~9% blood loss moved our heart
   * rate 2.5% where Pulse's moved 17%, and the shockStates oracle found the same under-response at
   * the other end of the severity range. One shared assumption, two modules — so both now use the
   * same saturating form and the same 8 mmHg half-activation. See
   * `src/modules/shockStates/engine/constants.ts`, which carries the longer note.
   *
   * A high-gain loop holds a SMALL error with a LARGE output. That is why Pulse can defend pressure
   * to within 1.2% of setpoint and be tachycardic at the same time, and why a model that reports
   * the error instead of correcting it teaches the opposite lesson.
   */
  HALF_ACTIVATION_ERROR_MMHG: 8,
  /** Beats per minute the reflex can add or remove at full drive. Raised with the gain above: the
   * rate arm is what Pulse leans on hardest, and 30 could not reach the +17% a Class I loss
   * produces even with the drive corrected. */
  MAX_HEART_RATE_ADJUST: 45,
  /** Fractional rise in vascular tone at full drive. Trimmed from 0.30 as the rate arm above was
   * raised: the finding behind both numbers is that this reflex leaned almost entirely on
   * resistance, so rebalancing the two arms IS the fix rather than a tuning of either alone. */
  MAX_TONE_ADJUST: 0.2,
  // Fast: seconds-scale reflex.
  TAU_SECONDS: 8,
  /**
   * How slowly the setpoint the reflex defends drifts toward the pressure it is actually seeing.
   *
   * Baroreceptors RESET. They defend against an acute change over seconds to minutes and then
   * accept the new pressure as normal, which is exactly why chronic hypertension persists instead
   * of being reflexively corrected away — and why the reflex is not a long-term controller of
   * arterial pressure at all. The kidney is.
   *
   * Without this the corrected reflex was too good at its job in the wrong direction: a kidney at
   * 25% function expanded blood volume to 130% of normal and the reflex held the pressure rise to
   * 4%, which teaches that renal failure does not cause hypertension. Slow relative to RAAS, so
   * the acute defence this module is otherwise about is untouched.
   */
  RESETTING_TAU_SECONDS: 900,
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
