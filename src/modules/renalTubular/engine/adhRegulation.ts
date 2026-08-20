import { ADH } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Target ADH level (0..1). Hypothalamic osmoreceptors sense PLASMA osmolality and respond over
 * a very narrow range — essentially silent below threshold, maximal a mere ~18 mOsm/kg above
 * it. That steepness is what holds plasma osmolality within a few percent despite wildly
 * varying water intake.
 *
 * Scaled by secretory capacity: in CENTRAL diabetes insipidus the osmoreceptors sense
 * correctly but the posterior pituitary cannot release ADH, so this target stays near zero
 * no matter how concentrated the plasma becomes.
 */
export function adhLevelTarget(plasmaOsmolality: number, adhSecretionCapacity: number): number {
  const osmoticDrive = scaleClamped(plasmaOsmolality, ADH.THRESHOLD_MOSM, ADH.SATURATION_MOSM, 0, 1);
  return clamp(osmoticDrive * clamp(adhSecretionCapacity, 0, 1.5), 0, 1);
}
