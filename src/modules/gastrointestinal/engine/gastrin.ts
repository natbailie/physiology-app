import { GASTRIN } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Target G-cell gastrin drive (0..1): stimulated by luminal protein, gastric distension, and
 * vagal ACh; braked by somatostatin once the stomach has become sufficiently acidic — the
 * loop that normally self-limits gastric acidification. An autonomous (gastrinoma) source
 * bypasses this brake entirely, the key Zollinger-Ellison teaching point.
 */
export function gastrinDriveTarget(
  mealProteinGrams: number,
  mealVolumeML: number,
  vagalTone: number,
  somatostatinDrive: number,
  autonomousGastrinSecretion: number,
): number {
  const proteinStim = scaleClamped(mealProteinGrams, 0, GASTRIN.PROTEIN_SATURATION_G, 0, 1) * GASTRIN.PROTEIN_GAIN;
  const distensionStim = scaleClamped(mealVolumeML, 0, GASTRIN.DISTENSION_SATURATION_ML, 0, 1) * GASTRIN.DISTENSION_GAIN;
  const vagalStim = scaleClamped(vagalTone, 0, GASTRIN.VAGAL_SATURATION, 0, 1) * GASTRIN.VAGAL_GAIN;

  const brake = clamp(1 - somatostatinDrive * GASTRIN.SOMATOSTATIN_BRAKE_GAIN, 0, 1);
  const physiological = clamp(proteinStim + distensionStim + vagalStim, 0, 1.5) * brake;

  const autonomous = clamp(autonomousGastrinSecretion / 100, 0, 1);
  return clamp(physiological + autonomous, 0, 1);
}
