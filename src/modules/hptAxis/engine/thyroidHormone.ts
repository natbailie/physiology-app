import { CONVERSION, T4, AUTONOMOUS_THYROID } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Peripheral T4→T3 conversion (deiodinase activity) — the module's distinctive mechanism.
 * T3 is derived fresh each tick from T4 rather than integrated as its own state, since
 * conversion is fast relative to T4's week-long turnover. Illness/starvation suppresses
 * conversion efficiency directly, which is exactly the sick-euthyroid mechanism: T3 falls
 * while T4 (and TSH) can remain near-normal, since the gland/axis itself isn't diseased.
 */
export function t3Level(t4Level: number, illnessSeverity: number, acuteIllnessBolus: number): number {
  const illnessSignal = clamp(illnessSeverity / 100 + acuteIllnessBolus, 0, 1);
  const efficiency = conversionEfficiency(illnessSignal);
  return t4Level * CONVERSION.T4_TO_T3_BASELINE_RATIO * efficiency;
}

export function conversionEfficiency(illnessSignal: number): number {
  return clamp(1 - illnessSignal * CONVERSION.ILLNESS_SUPPRESSION_GAIN, CONVERSION.MIN_EFFICIENCY, 1);
}

/**
 * Target plasma T4 (µg/dL): from TSH-driven thyroid output (gated by thyroidGlandFunction),
 * plus any autonomous (TSH-independent) stimulation (e.g. Graves' disease) and any exogenous
 * levothyroxine.
 */
export function t4LevelTarget(
  tshLevel: number,
  thyroidGlandFunction: number,
  autonomousThyroidStimulation: number,
  exogenousLevothyroxine: number,
): number {
  const endogenous = T4.BASAL_UGDL + tshLevel * T4.TSH_GAIN_UGDL * thyroidGlandFunction;
  const autonomous = autonomousThyroidStimulation * AUTONOMOUS_THYROID.GAIN_UGDL_PER_UNIT;
  const exogenous = exogenousLevothyroxine * T4.EXOGENOUS_GAIN_UGDL_PER_UNIT;
  return clamp(endogenous + autonomous + exogenous, T4.MIN_UGDL, T4.MAX_UGDL);
}
