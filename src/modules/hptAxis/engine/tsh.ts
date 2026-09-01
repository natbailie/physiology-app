import { TSH, TSH_ASSAY } from './constants';
import { feedbackSignal } from './trh';
import { clamp } from '@/shared/lib/math';

/**
 * Target pituitary TSH level (0..1): driven by TRH, suppressed by rising T4/T3, gated by
 * pituitaryTshFunction — a patient with pituitaryTshFunction=0 can't raise TSH no matter how
 * low T4 falls, which is exactly the mechanism behind secondary hypothyroidism.
 */
export function tshLevelTarget(trhDrive: number, t4Level: number, currentT3Level: number, pituitaryTshFunction: number): number {
  const signal = feedbackSignal(t4Level, currentT3Level);
  const driven = trhDrive * TSH.TRH_GAIN;
  const feedbackTerm = -(signal - TSH.FEEDBACK_SETPOINT) / TSH.FEEDBACK_SENSITIVITY;
  return clamp(clamp(driven + feedbackTerm, 0, 1) * pituitaryTshFunction, 0, 1);
}


/**
 * TSH as an assay would report it, mIU/L — see `TSH_ASSAY`.
 *
 * A function of circulating hormone and of whether the pituitary can respond to it, which is what
 * separates a thyroid that has failed from a pituitary that has. Both present with a low T4; only
 * the TSH tells them apart, and only if it is expressed in the units the discrimination is made in.
 */
export function tshMilliUnitsPerL(t4UgDl: number, pituitaryTshFunction: number): number {
  const raw = Math.pow(10, TSH_ASSAY.LOG_INTERCEPT - TSH_ASSAY.LOG_SLOPE_PER_UGDL * t4UgDl);
  return clamp(raw * clamp(pituitaryTshFunction, 0, 2), TSH_ASSAY.MIN_MIU_L, TSH_ASSAY.MAX_MIU_L);
}
