export type HearingState_Classification =
  | 'normal hearing'
  | 'conductive loss'
  | 'sensorineural loss'
  | 'mixed loss';

export interface HearingInputs {
  /** Stimulus frequency, Hz (125-8000). */
  stimulusFrequencyHz: number;
  /** Stimulus level, dB HL (-10 to 110). */
  stimulusLevelDbHl: number;
  /** Outer hair cell integrity, fraction (0-1). Low models cochlear amplifier damage. */
  outerHairCellIntegrity: number;
  /** Inner hair cell integrity, fraction (0-1). Low models transducer failure. */
  innerHairCellIntegrity: number;
  /** Conductive component, dB (0-60) — ossicular disease, effusion, stapes fixation. */
  conductiveLossDb: number;
  /** Depth of a noise-induced notch at 4 kHz, dB (0-60). */
  noiseNotchDepthDb: number;
  /** Age-related sloping loss severity, fraction (0-1). */
  presbycusisSeverity: number;
  /** Ménière-type low-frequency sensorineural loss, dB (0-60). */
  meniereLowFreqLossDb: number;
}

export interface HearingInternalState {
  simTimeSeconds: number;
  /** Temporary threshold shift from recent noise exposure, dB — decays over simulated hours. */
  temporaryThresholdShiftDb: number;
  /** Stapedius contraction, 0-1 — approaches its level-dependent target within milliseconds. */
  stapediusContraction: number;
}

/** Thresholds at the eight standard frequencies; arrays align with AUDIOGRAM_FREQS_HZ. */
export interface HearingDerived {
  airConductionDb: number[];
  boneConductionDb: number[];
  /** Pure-tone average of 0.5/1/2 kHz air-conduction thresholds, dB HL. */
  ptaDb: number;
  airBoneGapDb: number;
  /** Sensorineural threshold at the stimulus frequency, dB. */
  sensorineuralLossAtStimulusDb: number;
  sensationLevelDb: number;
  loudnessPct: number;
  recruitmentIndex: number;
  speechDiscriminationPct: number;
  rinneResult: string;
  weberCode: number;
  weberResult: string;
  stapediusActive: boolean;
  classification: HearingState_Classification;
  patternSummary: string;
  // Passthrough so tick() can stay a pure (state, derived, dt) function.
  stimulusFrequencyHz: number;
  stimulusLevelDbHl: number;
}

export interface HearingSnapshot {
  state: HearingInternalState;
  derived: HearingDerived;
}

export interface HearingHistoryPoint {
  t: number;
  pta: number;
  loudness: number;
  tts: number;
}
