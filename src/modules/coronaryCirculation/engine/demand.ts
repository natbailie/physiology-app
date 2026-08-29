import { DEMAND, SUPPLY, TIMING } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

export interface CycleTiming {
  systolicDurationSeconds: number;
  diastolicTimeFraction: number;
}

/** Systole shortens sub-linearly as the cycle tightens — but never to nothing. The share of the
 * cycle left over is the window in which the left ventricle is actually perfused, which is why
 * tachycardia is a supply problem as much as a demand one. */
export function cycleTiming(heartRateBpm: number): CycleTiming {
  const rrSeconds = clamp(60 / Math.max(heartRateBpm, 1), 0.2, 3);
  const systolic = clamp(
    TIMING.SYSTOLE_BASE_S + TIMING.SYSTOLE_SQRT_RR_COEFF * Math.sqrt(rrSeconds),
    TIMING.MIN_SYSTOLE_S,
    Math.min(TIMING.MAX_SYSTOLE_S, rrSeconds - 0.05),
  );
  return { systolicDurationSeconds: systolic, diastolicTimeFraction: clamp((rrSeconds - systolic) / rrSeconds, 0, 1) };
}

/** Rate-pressure product, bpm × mmHg — the classic bedside demand index. */
export function ratePressureProduct(heartRateBpm: number, systolicPressureMmHg: number): number {
  return heartRateBpm * systolicPressureMmHg;
}

/** Laplace wall stress relative to the reference resting ventricle: stress ∝ P·r/2h, with
 * radius taken from end-diastolic volume's two-thirds power and a constant wall thickness. */
export function wallStressIndex(endDiastolicVolumeMl: number, systolicPressureMmHg: number): number {
  const radiusFactor = Math.pow(Math.max(endDiastolicVolumeMl, 1) / DEMAND.EDV_REF, 2 / 3);
  return radiusFactor * (systolicPressureMmHg / DEMAND.SBP_REF);
}

/** Total oxygen demand in "normal resting flow" units. Subendocardial relief when starved is
 * applied by the caller through `ischaemiaLevel`. */
export function oxygenDemandIndex(params: {
  ratePressureProduct: number;
  wallStressIndex: number;
  contractility: number;
  exertionDrive: number;
  ischaemiaLevel: number;
}): number {
  const rppTerm = Math.pow(Math.max(params.ratePressureProduct, 1) / DEMAND.RPP_REF, DEMAND.RPP_EXP);
  const stressTerm = Math.pow(Math.max(params.wallStressIndex, 0.01), DEMAND.STRESS_EXP);
  const contractilityTerm = Math.pow(Math.max(params.contractility, 0), DEMAND.CONTRACTILITY_EXP);
  const exertionTerm = 1 + DEMAND.EXERTION_GAIN * params.exertionDrive;
  const starvationRelief = 1 - DEMAND.ISCHAEMIA_RELIEF * params.ischaemiaLevel;
  return rppTerm * stressTerm * contractilityTerm * exertionTerm * starvationRelief;
}

/** Left-ventricular end-diastolic pressure implied by filling volume, mmHg. */
export function lvedpMmHg(endDiastolicVolumeMl: number): number {
  return scaleClamped(
    endDiastolicVolumeMl,
    SUPPLY.LVEDP_EDV_MIN_ML,
    SUPPLY.LVEDP_EDV_MAX_ML,
    SUPPLY.LVEDP_MIN_MMHG,
    SUPPLY.LVEDP_MAX_MMHG,
  );
}
