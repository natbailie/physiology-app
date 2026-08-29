/** Calibrated so a healthy adult sits at GH ~2 ng/mL with IGF-1 ~200 ng/mL and prolactin
 * ~10 ng/mL; an autonomous somatotroph adenoma triples GH, fails to suppress with glucose,
 * and pushes IGF-1 past 350; prolactin crosses 25 (upper limit) with partial dopamine failure
 * and 250 (probable macroprolactinoma) with heavy secretion. */

export const GH_AXIS = {
  BASE_GH_NG_ML: 2,
  /** Autonomous adenoma contribution per unit secretion, ng/mL. */
  ADENOMA_GAIN_PER_UNIT: 0.38,
  GH_TAU_SECONDS: 3600,
  /** An oral glucose load suppresses REGULATED GH below 1 ng/mL — the screening test for
   * acromegaly, which fails precisely because the adenoma ignores hypothalamic control. */
  GLUCOSE_SUPPRESSION_FRACTION: 0.85,
  CHALLENGE_DURATION_SECONDS: 7200,
  IGF1_MIN_NG_ML: 110,
  IGF1_PER_GH_NG_ML: 26,
  IGF1_TAU_SECONDS: 260000,
  IGF1_ACROMEGALY_THRESHOLD: 320,
} as const;

export const SOMATIC = {
  /** Acromegalic tissue overgrowth accrues over months of sustained IGF-1 excess. */
  ACROMEGALY_TAU_SECONDS: 520000,
  ACRO_INDEX_MAX: 100,
  /** Linear growth (open epiphyses) responds faster than acral overgrowth. */
  HEIGHT_VELOCITY_CM_PER_YEAR_AT_EXCESS: 14,
  HEIGHT_VELOCITY_NORMAL_CM_PER_YEAR: 6,
} as const;

export const PROLACTIN_AXIS = {
  BASE_PROLACTIN_NG_ML: 8,
  /** Dopamine brake operates logarithmically: tenfold loss of effective tone reads as
   * roughly a hundredfold-range climb across the clinical spectrum. */
  LN_GAIN: 42,
  PROLACTIN_TAU_SECONDS: 7200,
  UPPER_LIMIT_NG_ML: 25,
  MACROADENOMA_LIKELY_NG_ML: 250,
  PROLACTINOMA_GAIN_PER_UNIT: 600,
  TRH_GAIN_PER_UNIT: 0.7,
} as const;

export const PITUITARY_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 900,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 20000,
} as const;

export const MASS = {
  /** Adenoma volume proxies, cm3, per unit of secretory input. */
  CC_PER_GH_UNIT: 0.03,
  CC_PER_PRL_UNIT: 0.05,
  CC_PER_MASS_UNIT: 0.07,
  /** Upward extension compressing the chiasma becomes measurable past roughly this. */
  FIELD_DEFECT_ONSET_CC: 1.4,
  FIELD_DEFECT_FULL_CC: 3.4,
  /** Dopamine delivery to the pituitary falls as any sellar mass enlarges — the stalk effect. */
  STALK_COMPRESSION_PER_CC: 0.09,
  MAX_STALK_COMPRESSION_FRACTION: 0.82,
} as const;

export const BROMOCRIPTINE = {
  DOSE_EFFECT_PCT: 75,
  DECAY_TAU_SECONDS: 900000,
  /** Dopamine agonists shrink prolactinoma tissue over weeks-months. */
  SHRINKAGE_PER_EFFECT_PCT: 0.6,
} as const;

export const GONADAL = {
  SUPPRESSION_ONSET_PROLACTIN_NG_ML: 30,
  SUPPRESSION_FULL_PROLACTIN_NG_ML: 280,
} as const;
