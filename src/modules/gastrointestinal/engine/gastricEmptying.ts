import { CCK, GASTRIC_EMPTYING } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Fractional gastric emptying rate per second (exponential decay of remaining volume),
 * slowed by CCK — fat in the duodenum is the primary brake on how fast the stomach empties
 * (the enterogastric reflex), which is why a fatty meal "sits" noticeably longer than an
 * equivalent carb-heavy one.
 */
export function gastricEmptyingRatePerSecond(cckDrive: number): number {
  return GASTRIC_EMPTYING.BASE_RATE_PER_SECOND * clamp(1 - cckDrive * CCK.GASTRIC_EMPTYING_SLOWING_GAIN, 0.15, 1);
}
