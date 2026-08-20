import { ADRENAL_RESERVE } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Integrates adrenal functional reserve for one tick. While exogenous glucocorticoid is above
 * the suppression threshold, sustained ACTH suppression slowly atrophies the gland — and ONLY
 * atrophies it: real regrowth needs the ACTH signal that's exactly what's being suppressed, so
 * recovery is gated to only happen once suppression lifts (rather than the two competing
 * continuously, which would just settle at a partial-depletion equilibrium and never reach the
 * "fully atrophied" state a prolonged course produces). Recovery is deliberately slower than
 * atrophy — this asymmetry is what makes abrupt steroid withdrawal dangerous even after ACTH
 * itself has recovered.
 */
export function tickAdrenalReserve(currentReserve: number, exogenousGlucocorticoid: number, dtSeconds: number): number {
  const suppressionSignal = Math.max(0, exogenousGlucocorticoid - ADRENAL_RESERVE.SUPPRESSION_THRESHOLD);
  if (suppressionSignal > 0) {
    const atrophy = ADRENAL_RESERVE.ATROPHY_GAIN_PER_SECOND * suppressionSignal * dtSeconds;
    return clamp(currentReserve - atrophy, ADRENAL_RESERVE.MIN, 1);
  }
  const recovery = ADRENAL_RESERVE.RECOVERY_GAIN_PER_SECOND * (1 - currentReserve) * dtSeconds;
  return clamp(currentReserve + recovery, ADRENAL_RESERVE.MIN, 1);
}
