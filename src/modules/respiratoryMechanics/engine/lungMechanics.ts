import { MECHANICS } from './constants';
import { clamp } from '@/shared/lib/math';

/** 1 cmH2O·L = 98.07 mJ. The unit conversion that turns a pressure-volume area into work. */
const CMH2O_LITRE_TO_JOULES = 0.09807;

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

/**
 * Work of breathing, joules per minute — the Otis, Fenn & Rahn (1950) decomposition.
 *
 * Each breath costs ELASTIC work stretching the lung against its compliance, and RESISTIVE work
 * driving gas through the airways. They pull in opposite directions with respiratory rate, which
 * is the whole reason the quantity is worth showing: big slow breaths are cheap on resistance and
 * expensive on elastance, rapid shallow ones the reverse, and every patient has a rate that
 * minimises the total. Disease moves that optimum — obstruction toward slow and deep, stiff lungs
 * toward rapid and shallow — which is why the breathing PATTERN of a respiratory patient is
 * diagnostic rather than incidental.
 *
 * Elastic work per breath is the triangle under the pressure-volume line, Vt^2 / 2C. Resistive
 * work is the pressure needed to drive mean inspiratory flow, R * V̇, moved through Vt. Volumes
 * arrive in mL and compliance in mL/cmH2O; the 1e-3 * 0.098 converts cmH2O·L to joules.
 */
export function workOfBreathingJPerMin(
  tidalVolumeML: number,
  respiratoryRate: number,
  complianceMLPerCmH2O: number,
  airwayResistanceCmH2OPerLPerSec: number,
  inspiratoryFraction = 0.4,
): number {
  const tidalL = Math.max(tidalVolumeML, 0) / 1000;
  const rate = Math.max(respiratoryRate, 1);
  const complianceLPerCmH2O = Math.max(complianceMLPerCmH2O, 1) / 1000;
  // Seconds spent inspiring, and so the mean inspiratory flow the resistance has to be driven at.
  const inspiratorySeconds = Math.max((60 / rate) * inspiratoryFraction, 0.05);
  const meanFlowLPerSec = tidalL / inspiratorySeconds;

  const elasticCmH2OL = (tidalL * tidalL) / (2 * complianceLPerCmH2O);
  const resistiveCmH2OL = airwayResistanceCmH2OPerLPerSec * meanFlowLPerSec * tidalL;

  return (elasticCmH2OL + resistiveCmH2OL) * CMH2O_LITRE_TO_JOULES * rate;
}
