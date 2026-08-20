import { GASTRIC_EMPTYING, MOTILITY } from './constants';

/**
 * Migrating motor complex (MMC) intensity at a given phase: quiescent/intermittent through
 * phases I-II, then a single intense "housekeeper" contraction wave (phase III) that sweeps
 * residual debris/bacteria through the fasting gut.
 */
export function mmcPulseIntensity(motilinPhase: number): number {
  return motilinPhase >= MOTILITY.MMC_PHASE_III_START_FRACTION ? MOTILITY.MMC_PHASE_III_INTENSITY : MOTILITY.MMC_QUIESCENT_INTENSITY;
}

/**
 * Overall visible motility/peristalsis intensity: MMC housekeeper waves while fasting,
 * emptying-driven peristalsis (scaled relative to the unstimulated baseline rate) while
 * there's still a meal in transit.
 */
export function motilityIntensity(isFasting: boolean, motilinPhase: number, gastricEmptyingRatePerSec: number): number {
  if (isFasting) return mmcPulseIntensity(motilinPhase);
  const relativeRate = gastricEmptyingRatePerSec / GASTRIC_EMPTYING.BASE_RATE_PER_SECOND;
  return MOTILITY.FED_PERISTALSIS_BASE + relativeRate * MOTILITY.FED_PERISTALSIS_GAIN;
}
