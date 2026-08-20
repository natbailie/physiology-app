import { MECHANICS } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * The R × C time constant, in seconds: how long the lung takes to empty passively.
 *
 * This single number explains air trapping. Expiration is passive and exponential, needing
 * roughly three time constants to complete. Raise resistance (or compliance) and the lung
 * needs longer — so if the next breath arrives before emptying finishes, volume stacks up
 * breath by breath. That is why a patient with COPD gets WORSE when they breathe faster, and
 * why the treatment for dynamic hyperinflation is to slow the respiratory rate.
 */
export function timeConstantSeconds(airwayResistance: number, effectiveComplianceValue: number): number {
  return Math.max(airwayResistance * effectiveComplianceValue * MECHANICS.RESISTANCE_TO_TIME_CONSTANT, MECHANICS.MIN_TIME_CONSTANT_SECONDS);
}

/**
 * Target lung volume (above residual volume) at a given point in the breath cycle. Inspiration
 * is modeled as active and reasonably complete; expiration as passive exponential decay
 * governed by the time constant — which is what leaves gas behind when the cycle is too short.
 */
export function targetVolumeAtPhase(breathPhaseFraction: number, tidalVolumeML: number, frcML: number): number {
  if (breathPhaseFraction <= MECHANICS.INSPIRATION_FRACTION) {
    const inspiratoryProgress = breathPhaseFraction / MECHANICS.INSPIRATION_FRACTION;
    return frcML + tidalVolumeML * Math.sin((Math.PI / 2) * inspiratoryProgress);
  }
  return frcML;
}

/** Seconds available for expiration in one breath at the current rate. */
export function expiratoryTimeSeconds(respiratoryRate: number): number {
  const breathDuration = 60 / clamp(respiratoryRate, 1, 60);
  return breathDuration * (1 - MECHANICS.INSPIRATION_FRACTION);
}
