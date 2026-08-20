import { SECRETIN } from './constants';
import { scaleClamped } from '@/shared/lib/math';

/**
 * Target secretin drive (0..1): S cells in the duodenum respond directly to luminal acid,
 * closing the loop that neutralizes gastric acid once it reaches the duodenum — secretin
 * drives pancreatic bicarbonate secretion, which is what raises duodenal pH back up (see
 * `engine.ts`'s duodenal pH target).
 */
export function secretinDriveTarget(duodenalPH: number): number {
  return scaleClamped(duodenalPH, SECRETIN.PH_FLOOR, SECRETIN.PH_CEILING, 1, 0);
}
