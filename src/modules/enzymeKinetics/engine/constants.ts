/** Calibrated so baseline lands on textbook Michaelis-Menten behaviour: a modest enzyme at
 * physiological conditions runs at about a third of Vmax with substrate near Km. */

export const KINETICS = {
  /** Readout smoothing time constant, seconds — an instrument needle, not a teleport. */
  RATE_TAU_SECONDS: 0.8,
  /** Baseline Km, mmol/L — chosen so the default [S] sits near half-saturation on the curve. */
  BASELINE_KM_MM: 0.5,
} as const;

export const KINETICS_SIMULATION = {
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 400,
  /** Real time — enzyme kinetics has no slow physiology to compress; the dynamics ARE the
   * algebra responding as you move the sliders. */
  TIME_SCALE: 1,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 20,
} as const;
