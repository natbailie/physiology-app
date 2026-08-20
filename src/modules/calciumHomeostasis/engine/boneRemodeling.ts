import { BONE, CALCITONIN } from './constants';
import { clamp } from '@/shared/lib/math';
import { magnesiumGate } from './pth';

/**
 * Bone resorption rate (0..~1.2): PTH drives osteoclastic resorption (indirectly, via RANKL on
 * osteoblasts), braked weakly by calcitonin. Magnesium gates PTH's *action* here, not just its
 * secretion — the second half of why hypomagnesemic hypocalcemia is refractory. Resorption
 * dissolves hydroxyapatite, releasing calcium and phosphate together.
 */
export function boneResorptionRate(pthLevel: number, calcitoninLevel: number, serumMagnesium: number): number {
  const pthAction = pthLevel * magnesiumGate(serumMagnesium) * BONE.PTH_RESORPTION_GAIN;
  const calcitoninBrake = calcitoninLevel * CALCITONIN.BONE_RESORPTION_BRAKE_GAIN;
  return clamp(BONE.BASAL_RESORPTION + pthAction - calcitoninBrake, 0, 1.2);
}

export function boneCalciumRelease(resorptionRate: number): number {
  return resorptionRate * BONE.CA_RELEASE_GAIN;
}

export function bonePhosphateRelease(resorptionRate: number): number {
  return resorptionRate * BONE.PHOSPHATE_RELEASE_GAIN;
}
