import { HEMODYNAMICS, RAAS, RENAL } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target RAAS activation (0-1) for the given sensed MAP/GFR: driven up by low
 * perfusion pressure and low GFR/Na delivery to the macula densa, and suppressed by
 * ANP. The engine relaxes the actual (smoothed) activation toward this target on
 * RAAS.TAU_SECONDS rather than snapping to it. This single 0-1 signal drives both
 * angiotensin II (vasoconstriction) and aldosterone (fluid retention) downstream.
 */
export function raasActivation(map: number, gfrValue: number, anpLevel: number): number {
  const mapDeficit = Math.max(0, HEMODYNAMICS.MAP_SETPOINT - map) / RAAS.MAP_SENSITIVITY;
  const gfrDeficit = Math.max(0, RENAL.BASELINE_GFR - gfrValue) / RAAS.GFR_SENSITIVITY;
  const raw = mapDeficit + gfrDeficit - anpLevel * RAAS.ANP_SUPPRESSION_GAIN;
  return clamp(raw, 0, 1);
}

export function angiotensinIIToneMultiplier(activation: number): number {
  return 1 + activation * RAAS.ANGIOTENSIN_TONE_GAIN;
}

export function angiotensinIIEfferentBoost(activation: number): number {
  return activation * RAAS.ANGIOTENSIN_EFFERENT_FF_GAIN;
}

export function aldosteroneReabsorptionBoost(activation: number): number {
  return activation * RAAS.ALDOSTERONE_REABSORPTION_GAIN;
}
