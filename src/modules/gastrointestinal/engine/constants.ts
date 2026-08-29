export const GASTRIC_PH = {
  // Equilibrium gastric pH with zero secretagogue drive (vagotomized, no gastrin) — mucus/food
  // residue baseline, not truly neutral since some non-parietal activity persists.
  UNSTIMULATED_PH: 5.0,
  MIN_PH: 1.0,
  MAX_PH: 7.0,
  // How far full (1.0) acid output drives pH down from the unstimulated baseline.
  ACID_SECRETION_PH_DROP: 3.8,
  // Freshly ingested food transiently buffers gastric acid, proportional to how full the
  // stomach still is — why post-meal gastric pH rises before falling again as acid catches up.
  MEAL_BUFFERING_PH_RISE: 1.6,
  // Fast equilibration: gastric mixing/secretion re-balances within roughly a minute of sim-time.
  TAU_SECONDS: 20,
};

export const PARIETAL_CELL = {
  VAGAL_SATURATION: 200,
  ACH_GAIN: 0.55,
  // Gastrin's major action: stimulating ECL cells to release histamine, which then acts on
  // the parietal cell's H2 receptors — the dominant pathway to acid secretion.
  ECL_HISTAMINE_GAIN: 0.6,
  // Gastrin's smaller direct parietal-cell action (CCK-B receptor).
  GASTRIN_DIRECT_GAIN: 0.2,
  // Fraction of the histamine-mediated contribution an H2 blocker can remove.
  H2_BLOCK_EFFICACY: 0.9,
  // Fraction of TOTAL output a PPI can remove — it blocks the shared final pathway
  // (the pump itself) regardless of which upstream stimulus drove it, so it's more complete.
  PPI_BLOCK_EFFICACY: 0.95,
};

export const GASTRIN = {
  PROTEIN_SATURATION_G: 60,
  PROTEIN_GAIN: 0.6,
  DISTENSION_SATURATION_ML: 600,
  DISTENSION_GAIN: 0.35,
  VAGAL_SATURATION: 200,
  VAGAL_GAIN: 0.3,
  SOMATOSTATIN_BRAKE_GAIN: 0.85,
  // Medium: G-cell secretory response.
  TAU_SECONDS: 20,
};

export const SOMATOSTATIN = {
  // D cells sense luminal acidity directly: fully active (1.0) at/below this pH...
  PH_FLOOR: 1.5,
  // ...fading to 0 by this pH.
  PH_CEILING: 4.0,
  TAU_SECONDS: 25,
};

export const CCK = {
  FAT_SATURATION_G: 50,
  FAT_GAIN: 0.75,
  PROTEIN_SATURATION_G: 60,
  PROTEIN_GAIN: 0.3,
  // How strongly CCK slows gastric emptying (the enterogastric feedback loop).
  GASTRIC_EMPTYING_SLOWING_GAIN: 0.7,
  TAU_SECONDS: 35,
};

export const SECRETIN = {
  // S cells respond to duodenal acid: fully active at/below this pH...
  PH_FLOOR: 3.0,
  // ...fading to 0 by this pH.
  PH_CEILING: 6.5,
  TAU_SECONDS: 30,
};

export const GIP_GLP1 = {
  CARB_SATURATION_G: 90,
  CARB_GAIN: 0.65,
  FAT_SATURATION_G: 50,
  FAT_GAIN: 0.35,
  TAU_SECONDS: 30,
};

export const DUODENAL_PH = {
  BASELINE: 6.5,
  MIN_PH: 2.0,
  MAX_PH: 8.0,
  ACID_LOAD_PH_DROP: 5.5,
  BICARB_NEUTRALIZATION_PH_RISE: 4.5,
  TAU_SECONDS: 18,
};

export const GASTRIC_EMPTYING = {
  // Fraction of remaining gastric volume emptied per second at baseline (exponential decay).
  BASE_RATE_PER_SECOND: 0.006,
};

export const MOTILITY = {
  FASTING_THRESHOLD: 0.05,
  // One full interdigestive MMC cycle, in simulated seconds.
  MMC_CYCLE_SECONDS: 90,
  // Phase III (the intense "housekeeper" sweep) occupies the last fraction of each cycle;
  // phases I-II (quiescent/intermittent) occupy the rest.
  MMC_PHASE_III_START_FRACTION: 0.82,
  MMC_QUIESCENT_INTENSITY: 0.12,
  MMC_PHASE_III_INTENSITY: 1,
  FED_PERISTALSIS_BASE: 0.3,
  FED_PERISTALSIS_GAIN: 1.4,
  FASTING_RELAX_TAU_SECONDS: 20,
};

export const GI_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 6,
  EAT_MEAL_REFILL_FRACTION: 1,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 600,
};
