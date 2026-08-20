import { TSH } from './constants';
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
