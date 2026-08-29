/** The six frontal-plane limb leads, each defined by an axis angle in the hexaxial reference. */
export type LimbLeadName = 'I' | 'II' | 'III' | 'aVR' | 'aVL' | 'aVF';

/**
 * The six chest leads. They lie in the HORIZONTAL plane, wrapping from just right of the
 * sternum (V1) round to the left axilla (V6), so between them they see the one axis the limb
 * leads are blind to — how far forward or back the heart's vector points.
 */
export type PrecordialLeadName = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6';

export type LeadName = LimbLeadName | PrecordialLeadName;

/**
 * The wall an injury current is centred on.
 *
 * Made an input rather than a constant because localisation is the point: the SAME injury
 * current projected onto twelve differently-angled leads is what turns "there is an infarct"
 * into "the infarct is here", and reciprocal change falls out of the same projection.
 */
export type InjuryTerritory = 'anterior' | 'inferior' | 'lateral' | 'posterior';

/**
 * The rhythms the engine can run. Each one is a statement about WHO is driving the chambers:
 *
 * - `sinus` / `sickSinus` — the SA node drives; sick sinus fails intermittently, with
 *   junctional escape filling the pauses.
 * - `atrialFibrillation` / `atrialFlutter` — the atria drive themselves (chaotically or as a
 *   macro re-entry circuit) and the AV node gates what reaches the ventricles.
 * - `wpw` — an accessory pathway arrives alongside the AV node and pre-excites the ventricles.
 * - `ventricularTachycardia` / `torsades` — a ventricular focus takes over and the atria are
 *   left marching independently behind it (AV dissociation).
 * - `ventricularFibrillation` — nobody drives anything; no organised depolarisation at all.
 */
export type Rhythm =
  | 'sinus'
  | 'atrialFibrillation'
  | 'atrialFlutter'
  | 'wpw'
  | 'sickSinus'
  | 'ventricularTachycardia'
  | 'torsades'
  | 'ventricularFibrillation';

/** The rhythms in which a ventricular focus, not the conduction system, drives the ventricles. */
export type VentricularFocusRhythm = 'ventricularTachycardia' | 'torsades';

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
  /** Which wall that injury is centred on */
  injuryTerritory: InjuryTerritory;
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
  /** Exponential moving average of RR intervals across recent ventricular beats, ms. A single
   * RR interval is a sample of a possibly erratic rhythm; the running mean is what a monitor's
   * heart-rate counter actually shows, and it is the stable quantity for a rhythm with
   * pauses (sick sinus) or an irregular response (atrial fibrillation) to settle onto. */
  emaRrMs: number;
  /** Length of the atrial cycle currently in progress, ms */
  currentAtrialIntervalMs: number;
  /** Length of the ventricular cycle in progress, ms — used when the ventricles are running
   * on their own (escape rhythm, or the irregular response of atrial fibrillation) */
  currentVentricularIntervalMs: number;
  /** Whether the atrial beat in progress will conduct through to the ventricles */
  currentBeatConducts: boolean;
  /** True while the SA node is mid-pause in sick sinus syndrome: the stretched atrial cycle
   * in progress carries NO impulse yet, so nothing may conduct from it and no P wave is
   * being written — the pause is electrical silence, not a delayed beat. */
  saPaused: boolean;
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
  /** Direction in the horizontal plane, degrees from straight-left toward anterior — what the
   * chest leads measure and the limb leads cannot */
  horizontalAngleDegrees: number;
  /** Where the QRS flips from mostly-negative to mostly-positive across the precordium.
   * Normally V3 or V4; null when no lead is net positive at all (poor R-wave progression) */
  rWaveTransitionLead: PrecordialLeadName | null;
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
  /** Rate averaged over recent beats — the number a bedside monitor displays, and the one
   * that stays readable when individual RR intervals are erratic or punctuated by pauses. */
  meanVentricularRateBpm: number;
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
  injuryTerritory: InjuryTerritory;
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
