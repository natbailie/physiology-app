/** Calibrated so an intact gland under basal ACTH sits at cortisol 100 (relative units,
 * i.e. within reference range), aldosterone 100, androgens 100; a classic 21-hydroxylase
 * block collapses both glucocorticoid and mineralocorticoid output while androgens soar. */

export const STEROID = {
  /** Enzymatic efficiencies at baseline, fraction of flux through each step. */
  FULL_EFFICIENCY: 1,
  /** Cortisol feedback on ACTH: every unit of cortisol deficit amplifies pituitary drive,
   * which is why blocked pathways accumulate PRECURSORS rather than simply running dry. */
  FEEDBACK_GAIN: 1.8,
  REPLACEMENT_ACTH_SUPPRESSION: 0.7,
  /** Diversion of accumulated substrate into the androgen pathway per unit of 21/11 block. */
  ANDROGEN_DIVERSION_21: 1.6,
  ANDROGEN_DIVERSION_11: 1.2,
  /** DOC has weak mineralocorticoid activity — enough to cause hypertension when it piles up. */
  DOC_MC_ACTIVITY_FRACTION: 0.07,
  MC_SALT_WASTING_THRESHOLD: 40,
  MC_HYPERTENSION_ONSET: 115,
  CRISIS_CORTISOL_THRESHOLD: 45,
  /** Hormone pools relax toward their steady states over simulated hours. */
  POOL_TAU_SECONDS: 7200,
} as const;

export const ADRENAL_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 1800,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 36000,
} as const;
