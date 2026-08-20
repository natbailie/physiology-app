import { CORTISOL, AUTONOMOUS_ADRENAL } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target plasma cortisol (µg/dL): from ACTH-driven adrenal output (gated by adrenalCortexFunction
 * and adrenalReserve — either can independently zero it out, modeling primary insufficiency or
 * steroid-induced atrophy respectively), plus any ACTH-independent autonomous secretion (e.g. an
 * adrenal adenoma) and any exogenous glucocorticoid's contribution to the cortisol-equivalent signal.
 */
export function cortisolLevelTarget(
  acthLevel: number,
  adrenalCortexFunction: number,
  adrenalReserve: number,
  autonomousAdrenalSecretion: number,
  exogenousGlucocorticoid: number,
): number {
  const endogenous = CORTISOL.BASAL_UGDL + acthLevel * CORTISOL.ACTH_GAIN_UGDL * adrenalCortexFunction * adrenalReserve;
  const autonomous = autonomousAdrenalSecretion * AUTONOMOUS_ADRENAL.GAIN_UGDL_PER_UNIT;
  const exogenous = exogenousGlucocorticoid * CORTISOL.EXOGENOUS_EQUIVALENCE_GAIN;
  return clamp(endogenous + autonomous + exogenous, CORTISOL.MIN_UGDL, CORTISOL.MAX_UGDL);
}
