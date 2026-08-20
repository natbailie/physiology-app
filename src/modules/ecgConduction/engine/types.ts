/** The six frontal-plane limb leads, each defined by an axis angle in the hexaxial reference. */
export type LeadName = 'I' | 'II' | 'III' | 'aVR' | 'aVL' | 'aVF';

export type Rhythm = 'sinus' | 'atrialFibrillation';

/** Anatomical regions of the conduction system and myocardium, in activation order. */
export type RegionId =
  | 'saNode'
  | 'rightAtrium'
  | 'leftAtrium'
  | 'avNode'
  | 'hisBundle'
  | 'rightBundle'
  | 'leftBundle'
  | 'septum'
  | 'rvFreeWall'
  | 'lvFreeWall'
  | 'lvBase';

/** What a region's membrane is doing right now — drives both the diagram and the ECG. */
export type RegionState = 'resting' | 'depolarizing' | 'depolarized' | 'repolarizing';

/** Which wave or segment is currently being inscribed. */
export type EcgSegment = 'baseline' | 'P wave' | 'PR segment' | 'QRS' | 'ST segment' | 'T wave';

export interface EcgInputs {
  /** Sinus rate, bpm (30-180) */
  heartRate: number;
  /** PR interval, ms (80-400) — time from atrial onset to ventricular onset. Above ~200 is
   * first-degree AV block */
  avDelayMs: number;
  /** AV block severity, 0-1: 0 conducts every beat, mid drops beats (second degree), 1 fully
   * dissociates atria from a ventricular escape rhythm (third degree) */
  avBlockSeverity: number;
  /** Right bundle branch conduction, fraction (0-1) — low produces RBBB */
  rightBundleConduction: number;
  /** Left bundle branch conduction, fraction (0-1) — low produces LBBB */
  leftBundleConduction: number;
  /** Ventricular action potential duration at 60 bpm, ms (200-500) — sets the QT interval */
  ventricularAPD: number;
  /** Serum potassium, mEq/L (2.5-8) — hyperkalemia peaks the T wave, widens QRS and flattens P */
  serumPotassium: number;
  /** Transmural ischemic injury, 0-1 — produces ST deviation via an injury current */
  ischemicInjury: number;
  /** Which limb lead the trace is recorded from */
  lead: LeadName;
  rhythm: Rhythm;
}

export interface EcgState {
  simTimeSeconds: number;
  /** Milliseconds since the current atrial (P wave) onset */
  atrialCycleTimeMs: number;
  /** Milliseconds since the current ventricular onset. Tracked separately from the atrial
   * clock so complete heart block — where the two run at independent rates — falls out
   * naturally rather than needing a special case. */
  ventricularCycleTimeMs: number;
  atrialBeatCount: number;
  ventricularBeatCount: number;
  /** Interval between the last two ventricular beats, ms — needed for rate-corrected QT and
   * for the irregular ventricular response of atrial fibrillation */
  lastRrIntervalMs: number;
  /** Length of the atrial cycle currently in progress, ms */
  currentAtrialIntervalMs: number;
  /** Length of the ventricular cycle in progress, ms — used when the ventricles are running
   * on their own (escape rhythm, or the irregular response of atrial fibrillation) */
  currentVentricularIntervalMs: number;
  /** Whether the atrial beat in progress will conduct through to the ventricles */
  currentBeatConducts: boolean;
  /** Guards against re-triggering the ventricles twice from one atrial beat */
  ventricularTriggeredThisBeat: boolean;
}

export interface RegionActivation {
  id: RegionId;
  label: string;
  state: RegionState;
  /** 0..1 progress through whichever phase the region is currently in */
  phaseProgress: number;
}

export interface EcgDerived {
  /** Net voltage in the selected lead, mV */
  ecgVoltageMv: number;
  regions: RegionActivation[];
  currentSegment: EcgSegment;
  /** Net instantaneous dipole, for the hexaxial inset */
  dipoleMagnitude: number;
  dipoleAngleDegrees: number;
  /** Mass-weighted mean QRS axis, degrees, and its clinical classification */
  meanQrsAxisDegrees: number;
  axisClassification: 'normal' | 'left deviation' | 'right deviation' | 'extreme';
  /** Measured intervals, ms */
  prIntervalMs: number;
  qrsDurationMs: number;
  qtIntervalMs: number;
  qtcMs: number;
  heartRateBpm: number;
  ventricularRateBpm: number;
  /** True when atria and ventricles are beating independently */
  isDissociated: boolean;
  rhythmRegular: boolean;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  avDelayMs: number;
  avBlockSeverity: number;
  rightBundleConduction: number;
  leftBundleConduction: number;
  ventricularAPD: number;
  serumPotassium: number;
  ischemicInjury: number;
  lead: LeadName;
  rhythm: Rhythm;
}

export interface EcgSnapshot {
  state: EcgState;
  derived: EcgDerived;
}

export interface EcgHistoryPoint {
  t: number;
  voltageMv: number;
}
