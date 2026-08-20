export type Sex = 'male' | 'female';

/** Which direction gonadal steroid feedback is currently running. Every other axis in this
 * app is permanently negative; the female HPG axis is the sole exception, flipping to
 * positive for the ovulatory surge. */
export type FeedbackMode = 'negative' | 'positive';

export type CyclePhase = 'follicular' | 'ovulation' | 'luteal' | 'menstrual' | 'steadyState';

export interface HpgInputs {
  /** Male or female axis — a toggle rather than a slider, since the two run structurally
   * different feedback logic */
  sex: Sex;
  /** GnRH pulse frequency, multiple of normal (0-2) — pulsatility is required for pituitary
   * responsiveness; CONTINUOUS (non-pulsatile) GnRH paradoxically suppresses the axis */
  gnrhPulseFrequency: number;
  /** Hypothalamic suppression, % (0-100) — stress, low energy availability, hyperprolactinemia */
  hypothalamicSuppression: number;
  /** Gonadal responsiveness to LH/FSH, fraction (0-1.5) — low models primary hypogonadism */
  gonadalFunction: number;
  /** Exogenous testosterone, % of a suppressive dose (0-200) — male; suppresses the
   * endogenous axis despite a high total testosterone */
  exogenousTestosterone: number;
  /** Exogenous estrogen/progestin, % (0-200) — female; the combined oral contraceptive,
   * which prevents the LH surge and therefore ovulation */
  exogenousEstrogenProgesterone: number;
}

export interface HpgState {
  simTimeSeconds: number;
  /** Smoothed hypothalamic GnRH drive, 0..1 (fastest actuator) */
  gnrhDrive: number;
  /** Smoothed pituitary gonadotropins, 0..1 */
  lhLevel: number;
  fshLevel: number;
  /** Male gonadal steroid output, 0..1 */
  testosteroneLevel: number;
  /** Sertoli-cell inhibin, 0..1 — selectively suppresses FSH, which is how primary
   * testicular failure can raise FSH more than LH */
  inhibinLevel: number;
  /** Female-only: position through a 28-day-equivalent cycle, 0..1 */
  cycleDayFraction: number;
  /** Female-only: growing follicle, 0..1 — the estrogen source in the follicular phase */
  follicleSize: number;
  estrogenLevel: number;
  progesteroneLevel: number;
  /** Integrator of sustained high estrogen exposure. Crossing its threshold is what FLIPS
   * feedback from negative to positive and triggers the LH surge — the surge emerges from
   * estrogen dynamics rather than being scheduled on a fixed day. */
  sustainedHighEstrogenExposure: number;
  /** Corpus luteum activity after ovulation, 0..1 — decays over ~14 days if no pregnancy */
  corpusLuteumActivity: number;
  /** True during the positive-feedback window */
  inPositiveFeedback: boolean;
}

export interface HpgDerived {
  sex: Sex;
  gnrhDrive: number;
  lhLevel: number;
  fshLevel: number;
  testosteroneLevel: number;
  inhibinLevel: number;
  estrogenLevel: number;
  progesteroneLevel: number;
  follicleSize: number;
  corpusLuteumActivity: number;
  cycleDayFraction: number;
  /** Cycle day 1-28, for display */
  cycleDay: number;
  cyclePhase: CyclePhase;
  /** Bound directly to HormoneArrow's `inhibitory` prop, so the feedback flip is visible */
  feedbackMode: FeedbackMode;
  /** Effective pituitary responsiveness given how pulsatile the GnRH signal is */
  pituitaryResponsiveness: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  gnrhPulseFrequency: number;
  hypothalamicSuppression: number;
  gonadalFunction: number;
  exogenousTestosterone: number;
  exogenousEstrogenProgesterone: number;
}

export interface HpgSnapshot {
  state: HpgState;
  derived: HpgDerived;
}

export interface HpgHistoryPoint {
  t: number;
  lh: number;
  fsh: number;
  gonadalSteroid: number;
}
