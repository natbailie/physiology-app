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

/**
 * Whether the stimulator is running.
 *
 * A named pair rather than a boolean, because `ToggleGroup` writes the option's `value` string
 * straight into the input — so a boolean field would be handed 'true' and 'false' and the type
 * would be a lie. Same shape as vision's `TorchEye`.
 */
export type StimulatorState = 'off' | 'on';

export interface MotorInputs {
  /**
   * Deep brain stimulation, on or off.
   *
   * A stimulator is implanted, switched on and left on — it is the most standing setting in this
   * module and it was the only on/off in the app with no presence on the control rail at all. It
   * lived in `dbsActive` on the state, flipped by a button that left the panel beside it unchanged,
   * so a learner could not see whether the device was running.
   */
  deepBrainStimulation: StimulatorState;
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
