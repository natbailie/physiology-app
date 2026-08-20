import { SOMATOSTATIN } from './constants';
import { scaleClamped } from '@/shared/lib/math';

/**
 * Target somatostatin drive (0..1): D cells sense luminal acidity directly — low gastric pH
 * activates them, and their output brakes both gastrin release and parietal cell secretion.
 * This is precisely the physiological brake an autonomous (gastrinoma) gastrin source bypasses.
 */
export function somatostatinDriveTarget(gastricPH: number): number {
  return scaleClamped(gastricPH, SOMATOSTATIN.PH_FLOOR, SOMATOSTATIN.PH_CEILING, 1, 0);
}
