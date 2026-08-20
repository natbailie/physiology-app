import { GIP_GLP1 } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Target combined GIP/GLP-1 (incretin) drive (0..1): K and L cells respond to carbohydrate
 * and fat arriving in the duodenum, gated by ongoing gastric emptying. These are the hormones
 * behind the "incretin effect" — oral glucose triggers more insulin release than the same
 * glucose given IV, because gut hormones prime the pancreas ahead of the glucose itself.
 */
export function gipGlp1DriveTarget(mealCarbGrams: number, mealFatGrams: number, gastricVolumeFraction: number): number {
  const carbStim = scaleClamped(mealCarbGrams, 0, GIP_GLP1.CARB_SATURATION_G, 0, 1) * GIP_GLP1.CARB_GAIN;
  const fatStim = scaleClamped(mealFatGrams, 0, GIP_GLP1.FAT_SATURATION_G, 0, 1) * GIP_GLP1.FAT_GAIN;
  return clamp(carbStim + fatStim, 0, 1.5) * gastricVolumeFraction;
}
