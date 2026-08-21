export type NmjClassification =
  | 'normal transmission'
  | 'myasthenia gravis'
  | 'Lambert-Eaton'
  | 'botulism'
  | 'non-depolarising block'
  | 'depolarising block'
  | 'cholinergic excess';

export interface NmjInputs {
  /** Vesicles available for release per impulse, fraction of normal (0-1.5). Botulinum toxin
   * cleaves the SNARE proteins that dock them, so release collapses at the very first step. */
  vesicleReleaseCapacity: number;
  /** Presynaptic voltage-gated calcium channel function, fraction (0-1.5). The target of the
   * antibody in Lambert-Eaton — calcium entry is what triggers release at all. */
  calciumChannelFunction: number;
  /** Postsynaptic acetylcholine receptor density, fraction (0-1.5). The target in myasthenia
   * gravis: the nerve releases normally and the message is not received. */
  receptorDensity: number;
  /** Acetylcholinesterase activity, fraction of normal (0-2). Low prolongs and amplifies each
   * quantum — the mechanism of pyridostigmine, and of organophosphate poisoning. */
  acetylcholinesteraseActivity: number;
  /** Competitive non-depolarising blocker occupancy, % (0-100) — rocuronium, vecuronium. */
  nondepolarisingBlocker: number;
  /** Depolarising blocker, % (0-100) — suxamethonium, which opens the receptor and holds it. */
  depolarisingBlocker: number;
  /** Stimulation frequency for the train, Hz (0.5-50). */
  stimulationFrequencyHz: number;
}

export interface NmjState {
  simTimeSeconds: number;
  /** Readily releasable vesicle pool, fraction of full. Depletes with use, refills between. */
  vesiclePool: number;
  /** Residual presynaptic calcium, which accumulates during rapid stimulation and raises
   * release probability — the basis of facilitation. */
  residualCalcium: number;
  /** Receptor desensitisation from sustained depolarising agonist. */
  desensitisation: number;
}

export interface NmjDerived {
  /** Quanta released per impulse. */
  quantalContent: number;
  /** End-plate potential, mV. */
  endPlatePotentialMv: number;
  /** How far the end-plate potential exceeds the threshold needed to fire the muscle fibre.
   * Normally about three to five — a large reserve, which is why transmission is reliable
   * until a great deal of it has been lost. */
  safetyFactor: number;
  transmissionProbability: number;
  /** Amplitudes of the four responses in a train-of-four, relative to a normal first twitch. */
  trainOfFour: number[];
  /** T4 divided by T1. Below about 0.9 is fade. */
  trainOfFourRatio: number;
  /** Response after a period of rapid stimulation, relative to the first. Above 1 is an
   * increment — the fingerprint of a presynaptic lesion. */
  postTetanicRatio: number;
  muscleForcePercent: number;
  vesiclePool: number;
  residualCalcium: number;
  desensitisation: number;
  classification: NmjClassification;
  patternSummary: string;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  vesicleReleaseCapacity: number;
  calciumChannelFunction: number;
  receptorDensity: number;
  acetylcholinesteraseActivity: number;
  nondepolarisingBlocker: number;
  depolarisingBlocker: number;
  stimulationFrequencyHz: number;
}

export interface NmjSnapshot {
  state: NmjState;
  derived: NmjDerived;
}

export interface NmjHistoryPoint {
  t: number;
  epp: number;
  safetyFactor: number;
  force: number;
  tofRatio: number;
}
