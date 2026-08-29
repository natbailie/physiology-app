import { ACCOMMODATION } from './constants';
import { clamp } from '@/shared/lib/math';

/** Dioptres of accommodation a target at this distance demands. */
export function demandForDistance(distanceMetres: number): number {
  return 1 / Math.max(distanceMetres, 0.05);
}

/** The lens can only ever deliver its amplitude; anything beyond it is blur, however hard
 * the ciliary muscle tries. */
export function accommodativeResponse(demandD: number, maximumAccommodationD: number): number {
  return Math.min(demandD, Math.max(maximumAccommodationD, 0));
}

export function accommodationDeficit(demandD: number, maximumAccommodationD: number): number {
  return Math.max(0, demandD - Math.max(maximumAccommodationD, 0));
}

/** Print blurs once the shortfall exceeds the eye's depth of focus. */
export function isBlurActive(deficitD: number): boolean {
  return deficitD > ACCOMMODATION.BLUR_THRESHOLD_D;
}

/** Nearest distance that can be brought into focus, cm — the near point. */
export function nearPointCm(maximumAccommodationD: number): number {
  return (100 * 1) / Math.max(maximumAccommodationD, 0.05);
}

/** The near triad's third limb: accommodative effort constricts the pupils beyond what scene
 * luminance alone produces. */
export function nearMiosisMm(accommodativeResponseD: number): number {
  const drive = clamp(accommodativeResponseD / ACCOMMODATION.NEAR_DRIVE_REF_D, 0, 1);
  return ACCOMMODATION.NEAR_MIOSIS_MAX_MM * drive;
}

/** Convergence demand in prism dioptres for an average pupillary distance. */
export function convergenceDemandPrismD(accommodativeResponseD: number): number {
  return 6.2 * accommodativeResponseD;
}
