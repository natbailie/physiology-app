import { DBS, MOVEMENT, TREMOR } from './constants';
import { clamp } from '@/shared/lib/math';
import type { MotorInputs, MotorState_Classification } from './types';

/**
 * Bradykinesia from dopamine depletion: the indirect pathway runs unopposed, thalamic drive
 * to motor cortex is suppressed, and everything — starting, moving, stopping — slows.
 * The exponent makes early loss tolerable and late loss catastrophic.
 */
export function bradykinesiaIndex(effectiveDopaminePct: number): number {
  const deficit = clamp(1 - effectiveDopaminePct / 100, 0, 1);
  return Math.pow(deficit, 1.5);
}

export function initiationLatencyMs(bradykinesia: number): number {
  return MOVEMENT.BASELINE_INITIATION_MS + MOVEMENT.BRADYKINESIA_MAX_EXTRA_MS * bradykinesia;
}

/** Achieved amplitude of a commanded reach: hypokinesia shrinks it (micrographia is the
 * everyday example), cerebellar dysmetria scatters it around the target. */
export function achievedAmplitudePct(commandAmplitude: number, bradykinesia: number): number {
  return clamp(commandAmplitude * (1 - MOVEMENT.HYPOKINESIA_MAX_AMPLITUDE_LOSS * bradykinesia), 0, 100);
}

export function dysmetriaPct(cerebellarCalibrationPct: number): number {
  return clamp((1 - cerebellarCalibrationPct / 100) * 45, 0, 45);
}

/** Resting tremor: the parkinsonian oscillator at 4-6 Hz, quiet during voluntary movement. */
export function restingTremorAmp(bradykinesia: number, commandAmplitude: number, dbsActive: boolean): number {
  const voluntarySuppression = 1 - TREMOR.VOLUNTARY_SUPPRESSION_OF_REST * clamp(commandAmplitude / 60, 0, 1);
  const amp = TREMOR.REST_MAX_AMP * Math.pow(bradykinesia, 1.2) * voluntarySuppression;
  return amp * (dbsActive ? DBS.REST_TREMOR_MULTIPLIER : 1);
}

/** Intention tremor: appears only DURING movement, grows as cerebellar calibration fails. */
export function intentionTremorAmp(cerebellarCalibrationPct: number, commandAmplitude: number): number {
  const active = clamp(commandAmplitude / 50, 0, 1);
  return (
    TREMOR.INTENTION_MAX_AMP *
    Math.pow(clamp(1 - cerebellarCalibrationPct / 100, 0, 1), 1.3) *
    active
  );
}

/** Postural tremor (essential type): present against gravity, eased by beta-blockade/alcohol. */
export function posturalTremorAmp(inputs: Pick<MotorInputs, 'essentialTremorDrive' | 'tremorSuppressantEffect'>): number {
  return (
    TREMOR.POSTURAL_MAX_AMP *
    clamp(inputs.essentialTremorDrive / 100, 0, 1) *
    (1 - clamp(inputs.tremorSuppressantEffect / 100, 0, 1))
  );
}

export function choreaAmp(striatalOutputLossPct: number, dbsActive: boolean): number {
  const amp = TREMOR.CHOREA_MAX_AMP * clamp(striatalOutputLossPct / 100, 0, 1);
  return amp * (dbsActive ? DBS.INVOLUNTARY_MULTIPLIER : 1);
}

export function ballismAmp(subthalamicLesionPct: number, dbsActive: boolean): number {
  // The STN powerfully brakes the thalamus; losing it releases violent proximal movements
  // at lesion severities that would merely wobble elsewhere.
  const amp = TREMOR.BALLISM_MAX_AMP * Math.pow(clamp(subthalamicLesionPct / 100, 0, 1), 1.4);
  return amp * (dbsActive ? DBS.INVOLUNTARY_MULTIPLIER : 1);
}

/** Dystonic co-contraction: sustained involuntary activation of antagonist muscles.
 * Produces abnormal posturing, not the flitting movements of chorea. */
export function dystoniaAmp(severityPct: number): number {
  return clamp(severityPct / 100, 0, 1) * 8;
}

/** Co-contraction index: how much the antagonist is activated alongside the agonist.
 * In normal movement this is near zero; in dystonia it fills the agonist-antagonist
 * space, producing the characteristic "overflow" of effort into wrong muscles. */
export function cocontractionIndex(severityPct: number): number {
  return clamp(severityPct / 100, 0, 1) * 0.85;
}

export function gaitClass(pattern: {
  parkinsonian: boolean;
  cerebellar: boolean;
  spastic: boolean;
  choreiform: boolean;
  dystonic: boolean;
}): string {
  if (pattern.parkinsonian) return 'shuffling, festinating, stooped';
  if (pattern.cerebellar) return 'broad-based, veering';
  if (pattern.spastic) return 'circumducting hemiplegic';
  if (pattern.choreiform) return 'dancing, interrupted by involuntary jerks';
  if (pattern.dystonic) return 'twisting, effortful posturing';
  return 'normal heel-toe';
}

export function classifyMotor(pattern: {
  subthalamicLesionPct: number;
  striatalOutputLossPct: number;
  effectiveDopaminePct: number;
  cerebellarCalibrationPct: number;
  corticospinalIntegrityPct: number;
  essentialTremorDrivePct: number;
  dystoniaSeverityPct: number;
}): MotorState_Classification {
  if (pattern.subthalamicLesionPct >= 60) return 'hemiballismus';
  if (pattern.striatalOutputLossPct >= 50 && pattern.effectiveDopaminePct > 55)
    return 'choreiform syndrome (Huntington-type)';
  if (pattern.effectiveDopaminePct <= 25) return 'advanced parkinsonism';
  if (pattern.effectiveDopaminePct <= 55) return 'early parkinsonism';
  if (pattern.cerebellarCalibrationPct <= 30) return 'cerebellar ataxia';
  if (pattern.corticospinalIntegrityPct <= 30) return 'spastic (UMN) hemiparesis';
  if (pattern.dystoniaSeverityPct >= 40) return 'focal dystonia';
  if (pattern.essentialTremorDrivePct >= 50) return 'essential tremor';
  return 'normal motor control';
}

export function patternSummary(pattern: {
  classification: MotorState_Classification;
  initiationLatencyMs: number;
  restingTremorAmp: number;
  intentionTremorAmp: number;
  posturalTremorAmp: number;
  rigidityScore: number;
  spasticityScore: number;
  cocontractionIndex: number;
}): string {
  switch (pattern.classification) {
    case 'normal motor control':
      return `initiates in ${pattern.initiationLatencyMs.toFixed(0)} ms, no tremor or tone change on either side`;
    case 'early parkinsonism':
      return `slowed initiation (${pattern.initiationLatencyMs.toFixed(0)} ms) with resting tremor ${pattern.restingTremorAmp.toFixed(1)} and cogwheel rigidity — TRAP: tremor, rigidity, akinesia, postural change`;
    case 'advanced parkinsonism':
      return `latency ${pattern.initiationLatencyMs.toFixed(0)} ms, amplitude collapsed, rest tremor ${pattern.restingTremorAmp.toFixed(1)} — the negative signs dominate`;
    case 'choreiform syndrome (Huntington-type)':
      return 'initiation NORMAL but the thalamus is released: random involuntary movement without weakness';
    case 'hemiballismus':
      return 'violent proximal flinging from loss of subthalamic braking on the thalamus';
    case 'cerebellar ataxia':
      return `initiation normal; intention tremor ${pattern.intentionTremorAmp.toFixed(1)} with dysmetria — error correction without calibration`;
    case 'spastic (UMN) hemiparesis':
      return `velocity-dependent spasticity ${pattern.spasticityScore.toFixed(1)} (clasp-knife) with brisk reflexes; no tremor at all`;
    case 'essential tremor':
      return `postural tremor ${pattern.posturalTremorAmp.toFixed(1)} with normal initiation and tone — better after alcohol, worse with caffeine`;
    case 'focal dystonia':
      return `sustained co-contraction ${pattern.cocontractionIndex.toFixed(2)} — the effort to move one muscle recruits its antagonist, producing abnormal posture rather than tremor`;
  }
}
