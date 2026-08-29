/** Calibrated so a normal term singleton sits at Hb ~11.5 g/dL (physiological dilution),
 * PaCO2 ~30 mmHg, creatinine ~0.5 mg/dL, CO +40%, and a fetal weight near 3.4 kg. */

export const MATERNAL = {
  /** Plasma volume expands ~45% by term; red cell mass only ~25% — the gap IS the
   * physiological anaemia of pregnancy. */
  PLASMA_VOL_MAX_INCREASE_PCT: 45,
  RED_CELL_MASS_MAX_INCREASE_PCT: 25,
  TWIN_PLASMA_EXTRA_PCT: 15,
  TWIN_RCM_EXTRA_PCT: 20,
  CARDIAC_OUTPUT_MAX_INCREASE_PCT: 40,
  TWIN_CO_EXTRA_PCT: 10,
  /** SVR falls under gestational vasodilatation; placental failure reverses it. */
  SVR_MAX_FALL_PCT: 20,
  SVR_RISE_PER_PLACENTA_DEFICIT_PCT: 38,
  MAP_MID_PREGNANCY_DIP_MMHG: 5,
  MAP_RISE_PER_PLACENTA_DEFICIT_MMHG: 26,
  /** Progesterone drives a chronic respiratory alkalosis, renally compensated. */
  PACO2_FALL_AT_TERM_MMHG: 7,
  BICARB_FALL_AT_TERM_MMOL_L: 3.6,
  GFR_MAX_INCREASE_PCT: 50,
  BASELINE_CREATININE_MG_DL: 0.72,
  SODIUM_FALL_AT_TERM_MMOL_L: 4.5,
} as const;

export const FETAL = {
  TERM_WEIGHT_G: 3400,
  GROWTH_EXPONENT: 3,
  /** Placental function scales growth between severe restriction and normal. */
  WEIGHT_PER_PLACENTA_FRACTION_MIN: 0.55,
  UTEROPLACENTAL_FLOW_SHARE_MAX_PCT: 18,
} as const;

export const HORMONE = {
  PROGESTERONE_TERM_NG_ML: 130,
  PROGESTERONE_POSTPARTUM_NG_ML: 4,
  PROGESTERONE_TAU_SECONDS: 130000,
  PROLACTIN_PRIMED_NG_ML: 200,
  PROLACTIN_BASELINE_NG_ML: 8,
  /** Prolactin right after delivery: high REGARDLESS of feeding, then decays unless
   * suckling sustains it — the reason milk comes in on day 2-3 even in mothers who
   * do not breastfeed, and why it then dries up. */
  POSTPARTUM_PROLACTIN_PEAK_NG_ML: 150,
  POSTPARTUM_PROLACTIN_TAU_SECONDS: 200000,
  PROLACTIN_SUCKLING_TARGET_NG_ML: 160,
  /** Half-saturation of the milk-supply response to prolactin. */
  PROLACTIN_HALF_SATURATION_NG_ML: 60,
  PROGESTERONE_MILK_BLOCK_THRESHOLD_NG_ML: 12,
} as const;

export const LACTATION = {
  FULL_SUPPLY_ML_PER_DAY: 750,
  SUCKLING_HALF_SATURATION_PCT: 60,
  PROLACTIN_HALF_SATURATION_NG_ML: 60,
  SUPPLY_TAU_SECONDS: 170000,
} as const;

export const LABOUR = {
  /** Cervical dilation progresses slowly early, rapidly late — the positive feedback of the
   * Ferguson reflex. Full dilation from 1 cm takes roughly ten simulated hours. */
  BASE_DILATION_RATE_CM_PER_MIN: 0.009,
  DILATION_COMPLETE_CM: 10,
  OXYTOCIN_LABOUR_PER_CM: 6,
  LET_DOWN_PULSE_SECONDS: 900,
  LET_DOWN_OXYTOCIN_SPIKE: 22,
} as const;

export const PREGNANCY_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 700,
  /** Labour runs on hours and lactation on days; both compressed to stay watchable. */
  TIME_SCALE: 360,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 35000,
} as const;
