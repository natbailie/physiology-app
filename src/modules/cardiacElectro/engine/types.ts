/** The four phases of the cardiac cycle, in the order the ventricle passes through them. */
export type CardiacPhase = 'filling' | 'isovolumicContraction' | 'ejection' | 'isovolumicRelaxation';

export interface CardiacInputs {
  /** Intrinsic SA node firing rate before autonomic modulation, bpm (40-180) */
  intrinsicHeartRate: number;
  /** Sympathetic drive, % (0-100) — steepens the pacemaker ramp and raises contractility */
  sympatheticDrive: number;
  /** Parasympathetic (vagal) drive, % (0-100) — flattens the pacemaker ramp */
  parasympatheticDrive: number;
  /** End-diastolic volume the ventricle fills to, mL (60-220) — preload */
  preloadEDV: number;
  /** Aortic pressure the ventricle must exceed to eject, mmHg (40-160) — afterload */
  afterloadPressure: number;
  /** Contractility, fraction where 1.0 = normal (0-2) — scales end-systolic elastance */
  contractility: number;
  /** AV nodal conduction delay, ms (60-300) — the PR interval; very long values model heart block */
  avConductionDelay: number;
}

export interface CardiacState {
  simTimeSeconds: number;
  /** Position within the current cardiac cycle, 0..1 */
  cyclePhaseFraction: number;
  /** SA node pacemaker ramp voltage, 0..1 — fires and resets on reaching threshold */
  saNodeRampVoltage: number;
  /** Left ventricular volume, mL (plant variable) */
  lvVolumeML: number;
  /** Left ventricular pressure, mmHg (plant variable) */
  lvPressureMmHg: number;
  /** Stroke volume of the last completed beat, mL — updated once per cycle so readouts don't
   * flicker mid-beat */
  strokeVolumeLastBeat: number;
  /** End-systolic volume of the last completed beat, mL */
  endSystolicVolumeLastBeat: number;
  /** Running minimum volume within the current cycle — this IS the end-systolic volume, and
   * tracking it as a minimum is more robust than sampling at a fixed phase, since when
   * ejection ends depends on afterload and contractility rather than on the clock. */
  minVolumeThisCycle: number;
  /** Running maximum volume within the current cycle — the end-diastolic volume actually
   * achieved, which can fall short of the requested preload at high heart rates. */
  maxVolumeThisCycle: number;
}

export interface CardiacDerived {
  heartRateBpm: number;
  cyclePhaseFraction: number;
  phase: CardiacPhase;
  lvVolumeML: number;
  lvPressureMmHg: number;
  strokeVolumeML: number;
  ejectionFractionPercent: number;
  cardiacOutputLPerMin: number;
  endDiastolicVolumeML: number;
  endSystolicVolumeML: number;
  saNodeRampVoltage: number;
  /** Schematic P-QRS-T deflection, arbitrary mV — illustrative of timing only, not a real ECG */
  ecgVoltage: number;
  /** True when AV delay is so long that atrial and ventricular activation have decoupled */
  isHeartBlock: boolean;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  intrinsicHeartRate: number;
  sympatheticDrive: number;
  parasympatheticDrive: number;
  preloadEDV: number;
  afterloadPressure: number;
  contractility: number;
  avConductionDelay: number;
  /** The EDV the ventricle is actually filling toward: the requested preload plus a share of what
   * the last beat failed to eject. Equals `preloadEDV` at the calibrated baseline. */
  fillingTargetEDV: number;
}

export interface CardiacSnapshot {
  state: CardiacState;
  derived: CardiacDerived;
}

export interface CardiacHistoryPoint {
  t: number;
  lvVolume: number;
  lvPressure: number;
  ecgVoltage: number;
}
