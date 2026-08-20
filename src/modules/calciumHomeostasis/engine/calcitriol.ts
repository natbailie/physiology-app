import { CALCITRIOL } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Target calcitriol (active vitamin D) level (0..1). PTH stimulates renal 1-alpha-hydroxylase,
 * but the reaction needs both substrate (dietary/cutaneous vitamin D) and functioning renal
 * tissue. Because this final activation step happens in the kidney, renal failure breaks it
 * regardless of how much vitamin D was ingested or how hard PTH drives — which is why CKD
 * patients need calcitriol analogues rather than plain vitamin D supplementation.
 */
export function calcitriolLevelTarget(pthLevel: number, vitaminDIntake: number, renalFunction: number): number {
  const substrate = scaleClamped(vitaminDIntake, 0, CALCITRIOL.VITAMIN_D_SATURATION_PCT, 0, 1);
  const hydroxylaseDrive = CALCITRIOL.BASAL + pthLevel * CALCITRIOL.PTH_GAIN;
  return clamp(hydroxylaseDrive * substrate * clamp(renalFunction, 0, 1), 0, 1);
}
