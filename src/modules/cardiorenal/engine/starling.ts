import { STARLING } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Frank-Starling preload factor: more volume stretches the ventricle and increases
 * stroke volume, up to a point. A heart with poor contractility decompensates
 * (preload factor falls again) once volume climbs past DECOMPENSATION_START_PCT —
 * this is the mechanism behind congestive heart failure.
 */
export function preloadFactor(bloodVolumePct: number, contractility: number): number {
  // Calibrated so preloadFactor(BV_BASELINE_PCT) === 1.0 exactly, matching the
  // baseline stroke volume constant. Rises further toward BV_OPTIMAL_PCT.
  const rising =
    bloodVolumePct <= STARLING.BV_BASELINE_PCT
      ? scaleClamped(bloodVolumePct, 0, STARLING.BV_BASELINE_PCT, 0, 1)
      : scaleClamped(bloodVolumePct, STARLING.BV_BASELINE_PCT, STARLING.BV_OPTIMAL_PCT, 1, STARLING.MAX_PRELOAD_FACTOR);

  if (bloodVolumePct <= STARLING.DECOMPENSATION_START_PCT) {
    return clamp(rising, STARLING.MIN_PRELOAD_FACTOR, STARLING.MAX_PRELOAD_FACTOR);
  }

  // Past the decompensation point, a weak heart can't keep up with the extra volume.
  const overload = bloodVolumePct - STARLING.DECOMPENSATION_START_PCT;
  const weakness = clamp(
    1 - contractility / STARLING.DECOMPENSATION_CONTRACTILITY_THRESHOLD,
    0,
    1,
  );
  const decompensationDrop = (overload / 100) * weakness * STARLING.MAX_PRELOAD_FACTOR;

  return clamp(rising - decompensationDrop, STARLING.MIN_PRELOAD_FACTOR, STARLING.MAX_PRELOAD_FACTOR);
}
