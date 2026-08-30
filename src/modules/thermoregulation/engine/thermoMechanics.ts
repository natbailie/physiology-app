import { CLINICAL, HEAT, SETPOINT } from './constants';
import { clamp } from '@/shared/lib/math';
import type { ThermoState_Classification } from './types';

/**
 * Evaporative ceiling: sweat only cools while it EVAPORATES, and humid air is already full.
 * At 100% humidity almost nothing leaves as vapour no matter how much is secreted.
 */
export function drynessFraction(humidityPct: number): number {
  return clamp(1 - clamp(humidityPct, 0, 100) / 115, 0.06, 1);
}

export function setPointTargetC(pyrogenLevel: number, antipyreticEffectPct: number): number {
  const shift =
    SETPOINT.PYROGEN_MAX_SHIFT_C *
    clamp(pyrogenLevel / 100, 0, 1) *
    (1 - (SETPOINT.ANTIPYRETIC_BLOCK_FRACTION * clamp(antipyreticEffectPct, 0, 100)) / 100);
  return SETPOINT.BASE_C + shift;
}

/** Shivering raises production; deep hypothermia silences it — the last defence failing. */
export function shiverTargetW(deficitC: number, coreTempC: number): number {
  if (deficitC <= 0) return 0;
  const drive = clamp(deficitC / 1.1, 0, 1);
  const fade = clamp((coreTempC - (HEAT.SHIVER_FADE_BELOW_C - HEAT.SHIVER_FADE_SPAN_C)) / HEAT.SHIVER_FADE_SPAN_C, 0, 1);
  return HEAT.SHIVER_MAX_W * drive * fade;
}

export function sweatTargetW(excessC: number, humidityPct: number, impairmentPct: number): number {
  if (excessC <= 0) return 0;
  const drive = clamp(excessC / 0.9, 0, 1);
  return HEAT.SWEAT_MAX_W * drive * drynessFraction(humidityPct) * (1 - clamp(impairmentPct, 0, 100) / 110);
}

export function skinFlowTarget(warmSignalC: number, coldSignalC: number): number {
  const base = 1;
  const dilate = clamp(warmSignalC / 1.6, 0, 1) * (HEAT.SKINFLOW_MAX - base);
  const constrict = clamp(coldSignalC / 2.2, 0, 1) * (base - HEAT.SKINFLOW_MIN);
  return clamp(base + dilate - constrict, HEAT.SKINFLOW_MIN, HEAT.SKINFLOW_MAX);
}

export function classifyThermo(pattern: {
  coreTempC: number;
  setPointC: number;
  shiveringW: number;
  sweatW: number;
}): ThermoState_Classification {
  // Thermoneutral first: a defended fever that has REACHED its point, or a resting balance,
  // both count as stable so long as the defences are quiet.
  if (
    Math.abs(pattern.coreTempC - pattern.setPointC) <= 0.15 &&
    pattern.shiveringW < 25 &&
    pattern.sweatW < 55
  ) {
    return pattern.setPointC >= CLINICAL.FEVER_SETPONT_C
      ? 'fever: set point elevated'
      : 'thermoneutral';
  }
  if (pattern.coreTempC < CLINICAL.MODERATE_HYPOTHERMIA_C)
    return 'moderate hypothermia: shivering fading';
  if (pattern.coreTempC < CLINICAL.MILD_HYPOTHERMIA_C) return 'mild hypothermia';
  // Fever means a DEFENDED high point; hyperthermia means the point never moved.
  if (pattern.setPointC >= CLINICAL.FEVER_SETPONT_C && pattern.coreTempC < pattern.setPointC + 0.4)
    return 'fever: set point elevated';
  if (pattern.coreTempC >= CLINICAL.HEATSTROKE_CORE_C && pattern.sweatW < HEAT.SWEAT_MAX_W * 0.25)
    return 'heat stroke: sweating failing';
  if (pattern.coreTempC >= CLINICAL.HYPERTHERMIA_CORE_C && pattern.setPointC < CLINICAL.FEVER_SETPONT_C)
    return 'hyperthermia: heat load overwhelming';
  if (pattern.coreTempC > pattern.setPointC + 0.05 || pattern.sweatW > 20) return 'heat defence: sweating';
  return 'cold defence: shivering';
}

export function patternSummary(pattern: {
  classification: ThermoState_Classification;
  coreTempC: number;
  setPointC: number;
  shiveringW: number;
  sweatW: number;
  netStorageW: number;
}): string {
  switch (pattern.classification) {
    case 'thermoneutral':
      return `production balances loss at ${pattern.netStorageW >= 0 ? '+' : ''}${pattern.netStorageW.toFixed(0)} W storage`;
    case 'cold defence: shivering':
      return `core ${pattern.coreTempC.toFixed(1)} below the defended point: shivering ${pattern.shiveringW.toFixed(0)} W of extra production`;
    case 'heat defence: sweating':
      return `sweating ${pattern.sweatW.toFixed(0)} W against a ${pattern.netStorageW >= 0 ? 'rising' : 'falling'} heat load`;
    case 'fever: set point elevated':
      return `point moved to ${pattern.setPointC.toFixed(1)}: chills while ${pattern.shiveringW > 10 ? 'still climbing' : 'held high'} — the fever is DEFENDED`;
    case 'hyperthermia: heat load overwhelming':
      return `set point normal at ${pattern.setPointC.toFixed(1)} yet core ${pattern.coreTempC.toFixed(1)} — load, not infection`;
    case 'heat stroke: sweating failing':
      return 'evaporation lost while production continues — the emergency inside the emergency';
    case 'mild hypothermia':
      return `core ${pattern.coreTempC.toFixed(1)} with maximal shivering still fighting`;
    case 'moderate hypothermia: shivering fading':
      return 'shivering silent below 32 C — defences gone, rewarming is now the treatment';
  }
}
