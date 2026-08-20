import { FVC_MANEUVER } from './constants';
import { clamp } from '@/shared/lib/math';
import type { SpirometryPattern } from './types';

/**
 * Peak expiratory flow, mL/s. Scales inversely with airway resistance — the height of the
 * flow-volume loop's expiratory limb.
 */
export function peakExpiratoryFlow(airwayResistance: number, vitalCapacity: number): number {
  const resistanceFactor = 1 / clamp(airwayResistance, 0.5, 20);
  return FVC_MANEUVER.BASELINE_PEAK_FLOW_ML_PER_SEC * resistanceFactor * clamp(vitalCapacity / 4600, 0.3, 1.2);
}

/**
 * Expiratory flow at a given fraction of the FVC already exhaled (0 = start, 1 = done).
 *
 * The characteristic shapes fall out of the time constant. A normal loop rises to a sharp peak
 * then falls off almost linearly. An obstructed loop cannot sustain flow at low volumes —
 * small airways collapse as lung volume falls — producing the SCOOPED, concave expiratory
 * limb that is the visual signature of obstruction. A restricted loop keeps its normal shape
 * but is simply narrower, because there is less volume to move.
 */
export function expiratoryFlowAtVolume(exhaledFraction: number, peakFlow: number, timeConstant: number): number {
  const fraction = clamp(exhaledFraction, 0, 1);
  // Rapid rise to peak over the first ~10% of the exhaled volume.
  const rise = clamp(fraction / 0.1, 0, 1);
  // Obstruction (a long time constant) makes flow collapse disproportionately at low volumes.
  const obstructionSeverity = clamp((timeConstant - 0.15) / 1.2, 0, 1);
  const concavity = 1 + obstructionSeverity * 2.2;
  const decline = Math.pow(1 - fraction, concavity);
  return peakFlow * rise * decline;
}

/**
 * Forced expiratory volume in the first second, as a fraction of FVC. Obstruction slows
 * emptying, so less of the vital capacity escapes in that first second — this ratio is the
 * single most useful spirometric number.
 */
export function fev1Fraction(timeConstant: number): number {
  // Passive exponential emptying: fraction exhaled by 1 second is 1 − e^(−t/τ), tempered
  // toward the ~80% a healthy forced maneuver actually achieves rather than the ~99.9% an
  // unrestrained exponential would predict at a normal time constant.
  const exponential = 1 - Math.exp(-1 / Math.max(timeConstant, 0.05));
  return clamp(exponential * 0.82, 0.15, 0.95);
}

/** Classifies the spirometry pattern the way it is read clinically: the ratio identifies
 * obstruction, and a reduced FVC with a preserved ratio identifies restriction. */
export function classifyPattern(fev1RatioPercent: number, fvcML: number, predictedFvcML: number): SpirometryPattern {
  const obstructed = fev1RatioPercent < FVC_MANEUVER.OBSTRUCTIVE_RATIO_THRESHOLD;
  const restricted = fvcML < predictedFvcML * FVC_MANEUVER.RESTRICTIVE_FVC_THRESHOLD_FRACTION;

  if (obstructed && restricted) return 'mixed';
  if (obstructed) return 'obstructive';
  if (restricted) return 'restrictive';
  return 'normal';
}
