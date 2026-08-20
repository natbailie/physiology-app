import { COUNTER_REGULATION } from './constants';
import { scaleClamped } from '@/shared/lib/math';

/** Target counter-regulatory drive (0..1) — cortisol/growth hormone/epinephrine's combined
 * secondary defense against a falling glucose, engaging as glucose drops below the
 * euglycemic range and maxing out at severe hypoglycemia. This is the hierarchical backup
 * that kicks in once glucagon alone isn't holding glucose up. */
export function counterRegulatoryDriveTarget(bloodGlucoseMgDl: number): number {
  return scaleClamped(bloodGlucoseMgDl, COUNTER_REGULATION.ACTIVATION_FLOOR_MGDL, COUNTER_REGULATION.ACTIVATION_CEILING_MGDL, 1, 0);
}
