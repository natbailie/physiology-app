export const PACEMAKER = {
  // Autonomic tone changes heart rate by changing the SLOPE of the SA node's diastolic
  // depolarization ramp — sympathetic steepens it (reaching threshold sooner), vagal
  // flattens it. Rate is an emergent consequence of ramp slope, not a directly set number.
  SYMPATHETIC_RATE_GAIN_BPM: 70,
  PARASYMPATHETIC_RATE_GAIN_BPM: 45,
  MIN_RATE_BPM: 25,
  MAX_RATE_BPM: 210,
};

export const ELASTANCE = {
  // Time-varying elastance (Suga-Sagawa, simplified): the ventricle's stiffness rises and
  // falls through the cycle, and pressure at any moment is E(t) × (V − V0).
  // Calibrated so a normal ventricle ejects to an end-systolic volume around 50 mL against an
  // 80 mmHg afterload, giving an ejection fraction in the textbook 55-70% band.
  END_SYSTOLIC_ELASTANCE: 2,
  END_DIASTOLIC_ELASTANCE: 0.055,
  // Unstressed volume: the volume at which the relaxed ventricle generates no pressure.
  UNSTRESSED_VOLUME_ML: 12,
  // Fraction of the cycle occupied by systole at a resting rate. Systole shortens far less
  // than diastole as heart rate rises, which is why tachycardia compromises filling first.
  SYSTOLE_FRACTION: 0.36,
  // Where within systole elastance peaks.
  PEAK_ELASTANCE_PHASE: 0.42,
};

export const VENTRICLE = {
  MIN_VOLUME_ML: 15,
  MAX_VOLUME_ML: 260,
  MIN_PRESSURE_MMHG: 0,
  MAX_PRESSURE_MMHG: 260,
  // Left atrial filling pressure — the driving pressure for diastolic filling.
  FILLING_PRESSURE_MMHG: 8,
  // How fast the ventricle fills toward its target EDV during diastole.
  FILLING_TAU_SECONDS: 0.09,
};

export const ECG = {
  // Schematic deflection timings as fractions of the cycle. Illustrative of SEQUENCE and
  // timing only — this is not a real ECG and must not be read as one.
  P_WAVE_CENTER: 0.02,
  P_WAVE_WIDTH: 0.05,
  P_WAVE_AMPLITUDE: 0.18,
  QRS_WIDTH: 0.028,
  QRS_AMPLITUDE: 1,
  T_WAVE_OFFSET_FROM_QRS: 0.3,
  T_WAVE_WIDTH: 0.075,
  T_WAVE_AMPLITUDE: 0.28,
  // AV delay above this decouples atria from ventricles — complete heart block.
  HEART_BLOCK_DELAY_MS: 260,
};

export const CARDIAC_SIMULATION = {
  MAX_DT_SECONDS: 0.02,
  RENDER_INTERVAL_MS: 33,
  // ~300 points at a 33ms render interval ≈ 10s of real time; at TIME_SCALE 0.35 that is
  // about 3.5s of simulated time — several complete beats visible on the trace at once.
  HISTORY_CAPACITY: 300,
  // Slower than real time: a beat lasts under a second, so slowing it down makes the four
  // PV-loop phases distinguishable as they are traced out.
  TIME_SCALE: 0.35,
  /** Simulated seconds of settling applied before the first frame. See `settleSeconds`
   * on `EngineLoopConfig`: measured as the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 10,
};
