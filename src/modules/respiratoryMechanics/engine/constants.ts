export const VOLUMES = {
  // Reference static volumes for a normal adult, mL.
  BASELINE_RESIDUAL_VOLUME_ML: 1200,
  BASELINE_VITAL_CAPACITY_ML: 4600,
  BASELINE_FRC_ML: 2400,
  BASELINE_COMPLIANCE: 100,
  // Stiff (low-compliance) lungs lose vital capacity; obstructed lungs trap air and gain
  // residual volume. These gains set how strongly each mechanism moves the static volumes.
  COMPLIANCE_VC_GAIN: 0.75,
  AIR_TRAPPING_RV_GAIN: 900,
  MIN_VITAL_CAPACITY_ML: 900,
  MAX_RESIDUAL_VOLUME_ML: 4200,
};

export const MECHANICS = {
  // Surfactant lowers alveolar surface tension. Without it, surface forces dominate and the
  // lung stiffens sharply — the Laplace-law problem behind neonatal RDS. Modeled as a
  // multiplicative penalty on compliance rather than the true nonlinear small-alveolus effect.
  SURFACTANT_MIN_COMPLIANCE_FACTOR: 0.25,
  // Airway resistance is expressed in cmH2O/L/s; compliance in mL/cmH2O. Their product (with
  // unit conversion) is the R×C time constant that governs emptying.
  RESISTANCE_TO_TIME_CONSTANT: 0.001,
  MIN_TIME_CONSTANT_SECONDS: 0.08,
  INSPIRATION_FRACTION: 0.4,
};

export const FVC_MANEUVER = {
  // A forced expiration takes a few seconds; effort-independent after the initial peak.
  DURATION_SECONDS: 6,
  // Peak expiratory flow scales inversely with airway resistance.
  BASELINE_PEAK_FLOW_ML_PER_SEC: 9500,
  // Normal FEV1/FVC sits around 80%; below 70% defines an obstructive pattern.
  OBSTRUCTIVE_RATIO_THRESHOLD: 70,
  // A restrictive pattern shows a reduced FVC with a PRESERVED (often raised) ratio.
  RESTRICTIVE_FVC_THRESHOLD_FRACTION: 0.8,
};

export const VQ = {
  // A simple two-compartment lung: unit A is the healthy compartment, unit B carries whatever
  // dead space or shunt has been dialed in.
  BASELINE_VENTILATION: 1,
  BASELINE_PERFUSION: 1,
  // HPV can divert this fraction of perfusion away from a poorly ventilated (shunt) unit.
  MAX_HPV_DIVERSION: 0.6,
  TAU_SECONDS: 8,
  // Guard against dividing by zero when a compartment is completely unperfused.
  MIN_PERFUSION: 0.02,
  MAX_VQ_RATIO: 99,
};

export const RESP_MECH_SIMULATION = {
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 33,
  // ~8s of real time at the render interval; at TIME_SCALE 0.6 that is ~5s of simulated
  // time, enough to show a couple of tidal breaths or one full forced maneuver.
  HISTORY_CAPACITY: 240,
  // Slightly slower than real time so the flow-volume loop is traced legibly.
  TIME_SCALE: 0.6,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 15,
};
