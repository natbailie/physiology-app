export type MotorState_Classification =
  | 'normal motor control'
  | 'early parkinsonism'
  | 'advanced parkinsonism'
  | 'choreiform syndrome (Huntington-type)'
  | 'hemiballismus'
  | 'cerebellar ataxia'
  | 'spastic (UMN) hemiparesis'
  | 'essential tremor'
  | 'focal dystonia';

export interface MotorInputs {
  /** Amplitude of the intended reach, 0-100 — the task the system is asked to perform. */
  movementCommandAmplitude: number;
  /** Striatal dopamine as a fraction of normal, %. */
  dopamineFraction: number;
  /** Loss of indirect-pathway striatal neurons (Huntington-type), %. */
  striatalOutputLoss: number;
  /** Subthalamic nucleus lesion, % — the hemiballismus lesion. */
  subthalamicLesion: number;
  /** Cerebellar calibration of amplitude and timing, % (100 = intact). */
  cerebellarCalibration: number;
  /** Corticospinal tract integrity, %. */
  corticospinalIntegrity: number;
  /** Postural-tremor generator drive (essential tremor), 0-100. */
  essentialTremorDrive: number;
  /** Suppression by beta-blockade or alcohol, 0-100. */
  tremorSuppressantEffect: number;
  /** Dystonic co-contraction severity, % (0-100). Sustained involuntary agonist-antagonist co-activation. */
  dystoniaSeverityPct: number;
}

export interface MotorInternalState {
  simTimeSeconds: number;
  /** Residual levodopa effect on top of the input fraction, decaying over hours. */
  levodopaBurst: number;
  /** Deep brain stimulation active. */
  dbsActive: boolean;
}

export interface MotorDerived {
  effectiveDopaminePct: number;
  bradykinesiaIndex: number;
  initiationLatencyMs: number;
  achievedAmplitudePct: number;
  amplitudeErrorPct: number;
  dysmetriaPct: number;
  restingTremorAmp: number;
  intentionTremorAmp: number;
  posturalTremorAmp: number;
  choreaAmp: number;
  ballismAmp: number;
  involuntaryMovementIndex: number;
  rigidityScore: number;
  spasticityScore: number;
  dystoniaAmp: number;
  cocontractionIndex: number;
  gaitClass: string;
  classification: MotorState_Classification;
  patternSummary: string;
  // Passthrough so tick() can stay a pure (state, derived, dt) function.
}

export interface MotorSnapshot {
  state: MotorInternalState;
  derived: MotorDerived;
}

export interface MotorHistoryPoint {
  t: number;
  latency: number;
  restTremor: number;
  involuntary: number;
}
