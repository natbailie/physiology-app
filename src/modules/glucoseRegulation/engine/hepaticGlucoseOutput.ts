import { HEPATIC } from './constants';
import { clamp } from '@/shared/lib/math';

/** Hepatic glucose output rate (mg/dL/sec): glycogenolysis driven by glucagon and, once
 * engaged, counter-regulatory hormones, gated by how much glycogen reserve remains. */
export function hepaticGlucoseOutputRate(glucagonLevel: number, counterRegulatoryDrive: number, hepaticGlycogenReserve: number): number {
  const drive = clamp(glucagonLevel * HEPATIC.GLUCAGON_GAIN + counterRegulatoryDrive * HEPATIC.COUNTER_REG_GAIN, 0, 1.5);
  return drive * hepaticGlycogenReserve * HEPATIC.MAX_OUTPUT_MGDL_PER_SECOND;
}

/**
 * Integrates hepatic glycogen reserve for one tick. Sustained glycogenolysis (active hepatic
 * output) depletes it; once output isn't being drawn on AND glucose is adequately fed, it
 * slowly replenishes — mirroring the HPA axis's adrenalReserve atrophy/recovery asymmetry,
 * here standing in for real glycogen resynthesis needing dietary glucose to rebuild from.
 */
export function tickHepaticGlycogenReserve(
  currentReserve: number,
  currentHepaticOutputRate: number,
  bloodGlucoseMgDl: number,
  dtSeconds: number,
): number {
  if (currentHepaticOutputRate > 0) {
    const depletion = HEPATIC.DEPLETION_GAIN_PER_SECOND * currentHepaticOutputRate * dtSeconds;
    return clamp(currentReserve - depletion, HEPATIC.MIN_RESERVE, 1);
  }
  const replenishSignal = bloodGlucoseMgDl > HEPATIC.REPLENISH_THRESHOLD_MGDL ? 1 : 0;
  const recovery = replenishSignal * HEPATIC.RECOVERY_GAIN_PER_SECOND * (1 - currentReserve) * dtSeconds;
  return clamp(currentReserve + recovery, HEPATIC.MIN_RESERVE, 1);
}
