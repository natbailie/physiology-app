import { ACTH, ACTH_ASSAY } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target pituitary ACTH level (0..1): driven by CRH, suppressed by rising cortisol (the
 * physiologically dominant negative-feedback site), gated by pituitaryFunction — a patient
 * with pituitaryFunction=0 (e.g. Sheehan's syndrome) can't raise ACTH no matter how strong
 * the CRH drive is, which is exactly the mechanism behind secondary adrenal insufficiency.
 */
export function acthLevelTarget(crhDrive: number, cortisolLevel: number, pituitaryFunction: number): number {
  const driven = crhDrive * ACTH.CRH_GAIN;
  const feedbackTerm = -(cortisolLevel - ACTH.FEEDBACK_SETPOINT_UGDL) / ACTH.FEEDBACK_SENSITIVITY_UGDL;
  return clamp(clamp(driven + feedbackTerm, 0, 1) * pituitaryFunction, 0, 1);
}


/**
 * ACTH as an assay would report it, pg/mL — see `ACTH_ASSAY`.
 *
 * The drive already carries the cortisol feedback and the pituitary gate, so this is a change of
 * units rather than a second model of the same thing.
 */
export function acthPgPerML(acthLevel: number): number {
  const raw = Math.pow(10, ACTH_ASSAY.LOG_INTERCEPT + ACTH_ASSAY.LOG_SLOPE_PER_DRIVE * clamp(acthLevel, 0, 1));
  return clamp(raw, ACTH_ASSAY.MIN_PG_ML, ACTH_ASSAY.MAX_PG_ML);
}
