import { CANAL, HALLPIKE, NYSTAGMUS, POSTURE } from './constants';
import { clamp } from '@/shared/lib/math';
import type { VestibularInputs, VestibularInternalState, VestibularState_Classification } from './types';

/**
 * Cupula deflection from RELATIVE motion between head and endolymph.
 *
 * During a sustained constant-velocity turn the endolymph catches up and the cupula drifts
 * back to centre — the canals signal CHANGES in velocity, not velocity itself. This is why
 * spinning sensation fades while you keep turning, and why stopping reverses the deflection
 * into post-rotatory nystagmus.
 */
export function cupulaDeflection(headVelDegPerSec: number, endolymphVelDegPerSec: number): number {
  const relative = headVelDegPerSec - endolymphVelDegPerSec;
  return clamp(relative * CANAL.DEFLECTION_GAIN_PER_DEG_S, -1, 1);
}

/** Canal afferent firing on one side: resting rate modulated by cupula position and function. */
export function canalFiring(deflection: number, functionFraction: number): number {
  return clamp(CANAL.RESTING_FIRING_SPIKES_PER_SEC + deflection * CANAL.MODULATION_GAIN, 0, Infinity) *
    clamp(functionFraction, 0, 1.2);
}

/**
 * Spontaneous nystagmus from the inter-ear firing comparison.
 *
 * A destructive lesion leaves one nerve below resting rate, so the intact side's tonic signal
 * reads as head acceleration TOWARD the intact ear — the eyes drift that way and fast phases
 * beat AWAY from the lesion. An irritative lesion does the opposite: firing above rest beats
 * nystagmus TOWARD the affected ear. Compensation suppresses the imbalance without restoring it.
 */
export function spontaneousSlowPhaseVelocity(
  imbalanceSpikesPerSec: number,
  compensation: number,
): number {
  const suppressed = imbalanceSpikesPerSec *
    (1 - NYSTAGMUS.COMPENSATION_WEIGHT * clamp(compensation, 0, 1));
  return suppressed * NYSTAGMUS.SLOW_PHASE_GAIN;
}

export function vertigoIntensity(slowPhaseVelocityDegPerSec: number): number {
  return clamp(Math.abs(slowPhaseVelocityDegPerSec) * NYSTAGMUS.VERTIGO_PER_DEG_S, 0, 100);
}

/** VOR gain is mechanical: compensation cannot raise it, which is the crux of chronic
 * unilateral loss — no vertigo, but a head impulse still betrays the deficit. */
export function vorGain(rightFunction: number, leftFunction: number): number {
  return clamp((rightFunction + leftFunction) / 2, 0, 1) * 0.95;
}

export function oscillopsiaPct(headVelDegPerSec: number, gain: number): number {
  const slip = Math.abs(headVelDegPerSec) * (1 - gain);
  return clamp((slip / 120) * 100, 0, 100);
}

/**
 * Dix-Hallpike response with peripheral signatures: latency while debris sinks, build-up,
 * then fatigue as it disperses. Central positional nystagmus has neither latency nor fatigue —
 * the timing IS the localisation.
 */
export function positionalNystagmusPct(state: Pick<VestibularInternalState, 'hallpikeSecondsRemaining' | 'hallpikeElapsedSeconds'>, debris: number): number {
  if (state.hallpikeSecondsRemaining <= 0 || debris < 0.5) return 0;
  const t = state.hallpikeElapsedSeconds;
  if (t < HALLPIKE.DEBRIS_LATENCY_SECONDS) return 0;
  const sinceLatency = t - HALLPIKE.DEBRIS_LATENCY_SECONDS;
  const buildup = clamp(sinceLatency / HALLPIKE.BUILD_SECONDS, 0, 1);
  const fatigue = Math.exp(-sinceLatency / HALLPIKE.FATIGUE_TAU_SECONDS);
  return clamp(100 * buildup * fatigue * clamp(debris, 0, 1), 0, 100);
}

export function rombergUnsteadinessPct(inputs: VestibularInputs): number {
  const bilateralCanalLoss = 1 - (clamp(inputs.rightCanalFunction, 0, 1) + clamp(inputs.leftCanalFunction, 0, 1)) / 2;
  return (
    POSTURE.ROMBERG_OTOLITH_WEIGHT_PCT * (1 - clamp(inputs.otolithFunction, 0, 1)) +
    POSTURE.ROMBERG_CANAL_WEIGHT_PCT * bilateralCanalLoss
  );
}

export function classifyVestibular(pattern: {
  positionalNystagmusPct: number;
  bothCanalsBelow: boolean;
  irritativeDriveLeft: number;
  acuteUnilateral: boolean;
}): VestibularState_Classification {
  // Position outranks everything: the Hallpike finding is only present while provoked.
  if (pattern.positionalNystagmusPct > 15) return 'BPPV: positional nystagmus';
  if (pattern.irritativeDriveLeft >= 0.2) return 'irritative lesion: nystagmus toward ear';
  if (pattern.bothCanalsBelow) return 'bilateral vestibular loss';
  if (pattern.acuteUnilateral)
    return 'acute unilateral vestibulopathy';
  return 'normal';
}

export function patternSummary(pattern: {
  classification: VestibularState_Classification;
  slowPhaseVelocityDegPerSec: number;
  vertigoIntensityPct: number;
  vorGain: number;
  rombergUnsteadinessPct: number;
  oscillopsiaPct: number;
}): string {
  switch (pattern.classification) {
    case 'normal':
      return 'no nystagmus at rest, VOR intact, no vertigo or unsteadiness';
    case 'acute unilateral vestibulopathy':
      return `one nerve silent below resting rate: nystagmus beats toward the intact ear while the brain reads the mismatch as acceleration — vertigo ${pattern.vertigoIntensityPct.toFixed(0)}%`;
    case 'compensated unilateral loss':
      return `vertigo gone but VOR gain ${pattern.vorGain.toFixed(2)} — compensation hides the lesion, it does not fix the mechanics`;
    case 'bilateral vestibular loss':
      return `no vertigo, no nystagmus, oscillopsia ${pattern.oscillopsiaPct.toFixed(0)}% and Romberg ${pattern.rombergUnsteadinessPct.toFixed(0)}% — balanced failure silences the comparison`;
    case 'BPPV: positional nystagmus':
      return 'transient geotropic torsional nystagmus after latency, fatiguing — mechanical, not metabolic';
    case 'irritative lesion: nystagmus toward ear':
      return `firing above rest drives nystagmus toward the affected ear, vertigo ${pattern.vertigoIntensityPct.toFixed(0)}%`;
  }
}
