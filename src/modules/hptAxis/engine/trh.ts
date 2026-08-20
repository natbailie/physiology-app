import { TRH, FEEDBACK, CONVERSION } from './constants';
import { clamp } from '@/shared/lib/math';

/** The T4-equivalent feedback signal sensed by the hypothalamus/pituitary: T4 plus T3
 * (converted to T4-equivalent units and weighted by its greater receptor potency). */
export function feedbackSignal(t4Level: number, currentT3Level: number): number {
  return t4Level + (currentT3Level / CONVERSION.T4_TO_T3_BASELINE_RATIO) * FEEDBACK.T3_POTENCY_MULTIPLIER;
}

/**
 * Target hypothalamic TRH drive (0..1): a basal drive suppressed by rising T4/T3 (negative
 * feedback). Fastest actuator in this module, mirroring CRH being the fastest in the HPA module.
 */
export function trhDriveTarget(t4Level: number, currentT3Level: number): number {
  const signal = feedbackSignal(t4Level, currentT3Level);
  return clamp(TRH.BASAL_DRIVE - (signal - TRH.FEEDBACK_SETPOINT) / TRH.FEEDBACK_SENSITIVITY, 0, 1);
}
