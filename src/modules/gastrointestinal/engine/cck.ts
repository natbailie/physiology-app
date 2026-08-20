import { CCK } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Target CCK drive (0..1): I cells in the duodenum respond to fat and protein arriving from
 * the stomach, so the stimulus is gated by how much of the meal is still emptying in. CCK
 * slows gastric emptying in turn (see `gastricEmptying.ts`) and drives gallbladder
 * contraction/pancreatic enzyme secretion — fat is the dominant, and longest-acting, stimulus.
 */
export function cckDriveTarget(mealFatGrams: number, mealProteinGrams: number, gastricVolumeFraction: number): number {
  const fatStim = scaleClamped(mealFatGrams, 0, CCK.FAT_SATURATION_G, 0, 1) * CCK.FAT_GAIN;
  const proteinStim = scaleClamped(mealProteinGrams, 0, CCK.PROTEIN_SATURATION_G, 0, 1) * CCK.PROTEIN_GAIN;
  return clamp(fatStim + proteinStim, 0, 1.5) * gastricVolumeFraction;
}
