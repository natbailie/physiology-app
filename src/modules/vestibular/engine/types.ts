export type VestibularState_Classification =
  | 'normal'
  | 'acute unilateral vestibulopathy'
  | 'compensated unilateral loss'
  | 'bilateral vestibular loss'
  | 'BPPV: positional nystagmus'
  | 'irritative lesion: nystagmus toward ear';

export interface VestibularInputs {
  /** Sustained head turn velocity, deg/s (-200 to 200). */
  headTurnVelocityDegPerSec: number;
  /** Right horizontal canal function, fraction of normal (0-1). Low models vestibular neuritis. */
  rightCanalFunction: number;
  /** Left horizontal canal function, fraction of normal (0-1). */
  leftCanalFunction: number;
  /** Central compensation of a static firing imbalance, fraction (0-1). Grows over days-weeks. */
  centralCompensation: number;
  /** Otolith (utricle/saccule) function, fraction (0-1). Drives unsteadiness, not vertigo. */
  otolithFunction: number;
  /** Canalith debris in the posterior canal (0-1): the mechanical trigger of BPPV. */
  canalithDebris: number;
  /** Irritative firing of the left nerve ABOVE resting rate (0-1) — an early Ménière-type
   * hyperactivity whose nystagmus beats TOWARD the affected ear. */
  irritativeDriveLeft: number;
}

export interface VestibularInternalState {
  simTimeSeconds: number;
  /** Endolymph angular velocity, deg/s — lags the head by inertia, decaying with canal tau. */
  endolymphVelDegPerSec: number;
  /** Seconds left in a Dix-Hallpike hold; zero when upright. */
  hallpikeSecondsRemaining: number;
  /** Elapsed seconds in the current Hallpike hold — drives latency and fatigability. */
  hallpikeElapsedSeconds: number;
  /** Seconds remaining in a head-impulse test; zero when idle. */
  impulseSecondsRemaining: number;
}

export interface VestibularDerived {
  /** Normalised cupula deflection from relative head-endolymph motion (0-1, signed by side). */
  cupulaDeflection: number;
  canalFiringRightSpikesPerSec: number;
  canalFiringLeftSpikesPerSec: number;
  firingImbalanceSpikesPerSec: number;
  /** Slow-phase velocity of spontaneous nystagmus after central compensation, deg/s.
   * Positive = right-canal firing dominance (fast phases beat toward the right);
   * a destructive RIGHT lesion therefore reads negative. */
  slowPhaseVelocityDegPerSec: number;
  vertigoIntensityPct: number;
  vorGain: number;
  /** Retinal slip / oscillopsia while the head is moving, %. */
  oscillopsiaPct: number;
  rombergUnsteadinessPct: number;
  positionalNystagmusPct: number;
  headImpulsePositive: boolean;
  classification: VestibularState_Classification;
  patternSummary: string;
  // Passthrough so tick() can stay a pure (state, derived, dt) function.
  headTurnVelocityDegPerSec: number;
  centralCompensation: number;
  /** Debris in the posterior canal, and otolith function. Both are structural facts the diagram
   * draws whether or not a provoking manoeuvre is being performed — positional nystagmus is
   * zero at rest even when the canaliths are sitting there. */
  canalithDebris: number;
  otolithFunction: number;
}

export interface VestibularSnapshot {
  state: VestibularInternalState;
  derived: VestibularDerived;
}

export interface VestibularHistoryPoint {
  t: number;
  spv: number;
  vertigo: number;
  cupula: number;
}
