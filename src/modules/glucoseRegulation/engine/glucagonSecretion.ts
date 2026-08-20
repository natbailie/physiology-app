import { GLUCAGON } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/** Target glucagon level (0..1): alpha cells respond reciprocally to insulin — low glucose
 * drives glucagon up, scaled by `glucagonSecretionCapacity`. The mirror image of
 * `insulinLevelTarget`'s glucose-dependent sigmoid, just running in the opposite direction. */
export function glucagonLevelTarget(bloodGlucoseMgDl: number, glucagonSecretionCapacity: number): number {
  const lowGlucoseDrive = scaleClamped(bloodGlucoseMgDl, GLUCAGON.SECRETION_FLOOR_MGDL, GLUCAGON.SECRETION_CEILING_MGDL, 1, 0);
  return clamp(lowGlucoseDrive * glucagonSecretionCapacity, 0, 1);
}
