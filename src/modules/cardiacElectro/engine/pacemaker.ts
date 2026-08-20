import { PACEMAKER } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * SA node firing rate (bpm). Autonomic tone works by changing the SLOPE of the pacemaker
 * ramp — sympathetic activity steepens the funny-current-driven diastolic depolarization so
 * threshold is reached sooner, while vagal activity flattens it (and hyperpolarizes the cell)
 * so threshold is reached later. Heart rate is the emergent consequence of that slope, not a
 * quantity the nervous system sets directly.
 */
export function pacemakerRateBpm(intrinsicHeartRate: number, sympatheticDrive: number, parasympatheticDrive: number): number {
  const sympathetic = clamp(sympatheticDrive / 100, 0, 1);
  const parasympathetic = clamp(parasympatheticDrive / 100, 0, 1);
  const rate =
    intrinsicHeartRate + sympathetic * PACEMAKER.SYMPATHETIC_RATE_GAIN_BPM - parasympathetic * PACEMAKER.PARASYMPATHETIC_RATE_GAIN_BPM;
  return clamp(rate, PACEMAKER.MIN_RATE_BPM, PACEMAKER.MAX_RATE_BPM);
}

/** The pacemaker ramp voltage (0..1) at a given point in the cycle — a sawtooth that climbs
 * to threshold, fires, and resets. Shown to make the "rate = ramp slope" idea visible. */
export function saNodeRamp(cyclePhaseFraction: number): number {
  return clamp(cyclePhaseFraction, 0, 1);
}
