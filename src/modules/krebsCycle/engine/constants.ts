/**
 * Calibrated so the module's baseline (a rested adult, mixed substrates, full oxygen, intact
 * cofactors) lands on the textbook picture: resting VO2 near 250 mL/min, VCO2 near 210, RQ
 * near 0.85, lactate under 1, and one acetyl-CoA yielding three NADH, one FADH2, one GTP and
 * two CO2 per turn (Lehninger).
 *
 * Flux follows demand while oxygen and cofactors permit; hypoxia, thiamine deficiency and PDH
 * defects stall the turns and spill pyruvate to lactate instead.
 */

export const KREBS_CYCLE = {
  /** Per-turn stoichiometry of one acetyl-CoA (Lehninger): the analytic oracle's ground truth. */
  NADH_PER_TURN: 3,
  FADH2_PER_TURN: 1,
  GTP_PER_TURN: 1,
  CO2_PER_TURN: 2,
  /** NADH made at PDH per unit of pyruvate flux (one per pyruvate, baseline flux 1). */
  PDH_NADH: 1,
  /** ATP per reducing equivalent (P/O ratios 2.5 and 1.5) plus one per substrate-level GTP. */
  ATP_PER_NADH: 2.5,
  ATP_PER_FADH2: 1.5,
  /** Resting gas exchange the baseline flux is scaled onto, mL/min. */
  RESTING_O2_ML_PER_MIN: 250,
  /** RQ of pure carbohydrate and pure fat oxidation. */
  RQ_CARBOHYDRATE: 1.0,
  RQ_FAT: 0.7,
  /** Resting lactate floor, mmol/L. */
  LACTATE_BASE_MMOL_L: 0.8,
  /** Lactate gained per unit of pyruvate denied the PDH gate, and per unit of hypoxic drive. */
  LACTATE_PER_BLOCKED_PYRUVATE: 6,
  LACTATE_PER_HYPOXIA: 4,
  /** Thiamine floor: even severe deficiency leaves a quarter of TPP-dependent activity. */
  THIAMINE_FLOOR: 0.25,
  /** Readout smoothing time constant, simulated seconds. */
  TAU_SECONDS: 5,
} as const;

export const KREBS_CYCLE_SIMULATION = {
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 400,
  /** Mitochondrial turnover answers within seconds, near real time with a little compression. */
  TIME_SCALE: 10,
  /** Simulated seconds of settling before the first frame, so the module opens on aerobic
   * balance instead of relaxing into it while the learner watches. */
  SETTLE_SECONDS: 120,
} as const;
