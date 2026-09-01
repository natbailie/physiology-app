export interface SimInputs {
  /** Heart rate, beats per minute (40-180, default 70) */
  heartRate: number;
  /** Cardiac contractility, fraction where 1.0 = 100% (0-2) */
  contractility: number;
  /** Vascular tone / SVR modifier, fraction where 1.0 = 100% (0.5-1.5) */
  vascularTone: number;
  /** Kidney function / nephron capacity, fraction where 1.0 = 100% (0-1.5) */
  kidneyFunction: number;
  /** Sodium/fluid intake rate, normalized units where 100 = baseline (0-300) */
  sodiumIntake: number;
}

export interface SimState {
  /** Blood volume, percent of baseline (baseline = 100) */
  bloodVolume: number;
  /** Accumulated simulated time, seconds */
  simTimeSeconds: number;
  /**
   * Smoothed reflex/hormone actuator levels — each relaxes toward an instantaneous
   * target with its own time constant (baroreflex fastest, RAAS slowest). Smoothing
   * them (rather than applying the raw target every tick) is what keeps the feedback
   * loop numerically stable and mirrors real reflex/hormone latency.
   */
  baroreflexDrive: number; // -1..1
  raasActivation: number; // 0..1
  anpLevel: number; // 0..1
  /** The pressure the reflex is currently defending, mmHg. Drifts toward the prevailing MAP —
   * see `BAROREFLEX.RESETTING_TAU_SECONDS`. */
  baroreflexSetpointMmHg: number;
}

export interface DerivedValues {
  preloadFactor: number;
  anpLevel: number;
  raasActivation: number;
  angiotensinII: number;
  aldosterone: number;
  baroreflexDrive: number;
  effectiveHeartRate: number;
  strokeVolume: number;
  cardiacOutput: number;
  effectiveSVR: number;
  meanArterialPressure: number;
  renalAutoregulation: number;
  renalBloodFlow: number;
  filtrationFraction: number;
  gfr: number;
  reabsorptionFraction: number;
  urineOutput: number;
  netFluidBalance: number;
}

export interface SimSnapshot {
  state: SimState;
  derived: DerivedValues;
}

export interface HistoryPoint {
  t: number;
  map: number;
  gfr: number;
  bloodVolume: number;
}
