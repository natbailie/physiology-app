import { UPTAKE } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Peripheral glucose uptake rate (mg/dL/sec): insulin-mediated uptake attenuated by
 * `insulinResistance` — the T2DM lever, which blunts insulin's *effect* without touching its
 * secretion — plus a small glucose-independent basal disposal (brain, red cells) that keeps
 * glucose from simply plateauing forever when insulin is entirely absent, as in unmanaged T1DM.
 */
export function glucoseUptakeRate(insulinLevel: number, insulinResistance: number, bloodGlucoseMgDl: number): number {
  const insulinSensitivity = clamp(1 - insulinResistance * UPTAKE.RESISTANCE_ATTENUATION, UPTAKE.MIN_SENSITIVITY, 1);
  const insulinMediated = insulinLevel * insulinSensitivity * UPTAKE.INSULIN_GAIN;
  const glucoseAvailability = clamp(bloodGlucoseMgDl / UPTAKE.REFERENCE_MGDL, 0, 3);
  return (insulinMediated + UPTAKE.BASAL_GAIN) * glucoseAvailability * UPTAKE.MAX_MGDL_PER_SECOND;
}
