/**
 * Calibrated so the module's baseline (a healthy adult at rest, eight hours post-absorptive)
 * lands on the textbook picture: normal fasting glucose, a mixed fuel mix leaning on
 * carbohydrate, trace ketones, and an energy bill equal to the resting metabolic rate.
 *
 * The RQ derives from the fuel mix (0.7 pure fat, 1.0 pure carbohydrate, 0.8 protein), so an
 * overlay of several measurements lands on a textbook "mixed" RQ near 0.82.
 */

export const METABOLISM = {
  /** Simulated protein oxidation at the post-absorptive baseline, g/day, matching intake at
   * equilibrium (muscle is a labile fuel reserve and the resting adult breaks down what it eats). */
  BASELINE_PROTEIN_OXIDATION_G_PER_DAY: 60,
  /** Energy yield of burning a gram of protein, kcal/kg -> kcal/g. */
  PROTEIN_KCAL_PER_G: 4,
  /** Readout smoothing time constant, seconds. */
  TAU_SECONDS: 1.5,
  /** Half-max of the ketogenic ramp: this many fasting hours puts ketone production at half-speed. */
  KETONE_HALF_MAX_HOURS: 26,
  /** This many starvation hours saturates ketone production. */
  KETONE_SATURATION_HOURS: 60,
  /** Max ketone level the model ever produces, mmol/L. */
  MAX_KETONES_MMOL_PER_L: 6,
} as const;

export const METABOLISM_SIMULATION = {
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 400,
  /** Simulated time per real second. Metabolism moves over hours, so hours are compressed to a
   * watchable ~2 seconds per hour of fasted time — a 72-hour starvation is a minute of wall
   * clock, and the fed-to-fasting flip lands mid-session rather than being inferred. */
  TIME_SCALE: 5,
  /** Simulated seconds of settling before the first frame, so the module opens already in the
   * eight-hour post-absorptive steady state rather than relaxing into it. */
  SETTLE_SECONDS: 90,
} as const;