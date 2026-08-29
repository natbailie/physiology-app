export const GNRH = {
  // Pulsatility is a PREREQUISITE, not a modulator. Continuous GnRH exposure downregulates
  // pituitary GnRH receptors, which is why long-acting GnRH agonists (leuprolide) suppress
  // the axis after an initial flare — the basis of medical castration.
  OPTIMAL_PULSE_FREQUENCY: 1,
  // Below this, pulses are too infrequent to drive the pituitary (hypothalamic amenorrhea).
  MIN_EFFECTIVE_FREQUENCY: 0.15,
  // Above this, the signal is effectively continuous and receptors downregulate.
  CONTINUOUS_THRESHOLD: 1.6,
  TAU_SECONDS: 12,
};

export const GONADOTROPINS = {
  LH_GAIN: 1,
  FSH_GAIN: 0.9,
  // Steroid negative feedback on LH.
  LH_FEEDBACK_SENSITIVITY: 0.75,
  // FSH is additionally and selectively suppressed by inhibin — which is why primary gonadal
  // failure can raise FSH disproportionately to LH.
  FSH_FEEDBACK_SENSITIVITY: 0.5,
  FSH_INHIBIN_SENSITIVITY: 0.7,
  // During the positive-feedback window LH is driven to maximum, producing the surge.
  SURGE_LH_TARGET: 1,
  SURGE_FSH_TARGET: 0.6,
  TAU_SECONDS: 25,
  // The surge itself rises far faster than ordinary gonadotropin regulation.
  SURGE_TAU_SECONDS: 6,
};

export const MALE = {
  TESTOSTERONE_LH_GAIN: 1,
  INHIBIN_FSH_GAIN: 0.85,
  TESTOSTERONE_TAU_SECONDS: 60,
  INHIBIN_TAU_SECONDS: 60,
  // Exogenous testosterone contributes to the feedback signal without needing the gonad —
  // which is exactly why it suppresses LH/FSH and shrinks endogenous production.
  EXOGENOUS_FEEDBACK_GAIN: 0.01,
};

export const FEMALE = {
  // One simulated cycle completes in this many seconds of engine time.
  CYCLE_PERIOD_SECONDS: 280,
  // Follicular phase occupies roughly the first half; the luteal phase is the fixed ~14 days.
  FOLLICULAR_FRACTION: 0.5,
  FOLLICLE_GROWTH_FSH_GAIN: 0.9,
  // Once selected, the dominant follicle keeps growing semi-independently of FSH — the
  // mechanism that lets its estrogen output escape negative feedback and reach surge levels.
  FOLLICLE_AUTONOMY_GAIN: 0.65,
  FOLLICLE_TAU_SECONDS: 45,
  ESTROGEN_FOLLICLE_GAIN: 1,
  ESTROGEN_TAU_SECONDS: 30,
  PROGESTERONE_LUTEAL_GAIN: 1,
  PROGESTERONE_TAU_SECONDS: 35,
  CORPUS_LUTEUM_DECAY_TAU_SECONDS: 90,

  // --- The positive-feedback switch ---
  // Estrogen must be BOTH high and SUSTAINED to flip feedback: a transient rise keeps
  // suppressing LH normally. This threshold-plus-duration requirement is what makes the surge
  // happen once per cycle instead of oscillating.
  POSITIVE_FEEDBACK_ESTROGEN_THRESHOLD: 0.62,
  EXPOSURE_ACCUMULATION_PER_SECOND: 0.02,
  EXPOSURE_DECAY_PER_SECOND: 0.012,
  EXPOSURE_SURGE_THRESHOLD: 1,
  // How long the positive-feedback window stays open once triggered.
  SURGE_DURATION_SECONDS: 16,
};

export const HPG_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  // A full menstrual cycle completes in roughly a minute of real time.
  TIME_SCALE: 5,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 560,
};
