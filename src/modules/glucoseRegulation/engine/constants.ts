export const BLOOD_GLUCOSE = {
  BASELINE_MGDL: 90,
  MIN_MGDL: 20,
  MAX_MGDL: 600,
};

export const MEAL = {
  MAX_BOLUS_GRAMS: 150,
  // Fraction of the remaining bolus absorbed into blood per second.
  ABSORPTION_RATE_PER_SECOND: 0.02,
  // mg/dL blood glucose rise per gram of carbohydrate absorbed.
  GRAMS_TO_MGDL_GAIN: 2.2,
};

export const INSULIN = {
  // Glucose (mg/dL) at which beta cells start ramping up secretion...
  SECRETION_THRESHOLD_MGDL: 90,
  // ...saturating at max secretion by this level.
  SECRETION_SATURATION_MGDL: 250,
  // Fast: insulin release in response to a glucose rise is rapid.
  TAU_SECONDS: 15,
};

export const EXOGENOUS_INSULIN = {
  UNITS_TO_BOLUS_GAIN: 0.15,
  MAX_BOLUS: 3,
  // Slow decay: a single dose's effect is deliberately the longest-acting transient in this
  // module, standing in for the hours a real subcutaneous insulin dose stays active.
  DECAY_TAU_SECONDS: 220,
};

export const GLUCAGON = {
  // Glucagon secretion is fully engaged at/below this glucose level...
  SECRETION_FLOOR_MGDL: 50,
  // ...fading to 0 by this level (roughly the euglycemic threshold).
  SECRETION_CEILING_MGDL: 100,
  TAU_SECONDS: 20,
};

export const COUNTER_REGULATION = {
  // Fully engaged at/below this glucose level (severe hypoglycemia)...
  ACTIVATION_FLOOR_MGDL: 40,
  // ...fading to 0 by this level — the threshold at which cortisol/GH/epinephrine normally
  // start defending against a falling glucose, ahead of symptomatic hypoglycemia.
  ACTIVATION_CEILING_MGDL: 70,
  // Slowest actuator in this module: the secondary hormonal defense, mirroring the HPA
  // axis's cortisol being its slowest cascade stage.
  TAU_SECONDS: 90,
};

export const HEPATIC = {
  GLUCAGON_GAIN: 0.7,
  COUNTER_REG_GAIN: 0.5,
  MAX_OUTPUT_MGDL_PER_SECOND: 0.5,
  DEPLETION_GAIN_PER_SECOND: 0.00006,
  RECOVERY_GAIN_PER_SECOND: 0.0004,
  MIN_RESERVE: 0.05,
  // Glucose above which glycogen stores are considered adequately fed to start replenishing.
  REPLENISH_THRESHOLD_MGDL: 100,
};

export const UPTAKE = {
  // Each unit of insulinResistance (0-2) reduces insulin sensitivity by this fraction.
  RESISTANCE_ATTENUATION: 0.45,
  MIN_SENSITIVITY: 0.1,
  INSULIN_GAIN: 1,
  // Glucose-independent basal disposal (e.g. brain/RBC uptake) — keeps glucose from simply
  // plateauing forever when insulin is absent, as in unmanaged T1DM.
  BASAL_GAIN: 0.15,
  REFERENCE_MGDL: 100,
  MAX_MGDL_PER_SECOND: 0.4,
};

export const GLUCOSE_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 6,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 3600,
};
