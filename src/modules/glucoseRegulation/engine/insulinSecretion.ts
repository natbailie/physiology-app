import { INSULIN } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Target insulin level (0..~2): endogenous beta-cell secretion is glucose-dependent and
 * scales with `insulinSecretionCapacity` (0 models T1DM — no endogenous response no matter
 * how high glucose climbs). Exogenous insulin is added directly and is NOT gated by
 * capacity — it's exactly the therapy that substitutes for an absent endogenous response.
 */
export function insulinLevelTarget(bloodGlucoseMgDl: number, insulinSecretionCapacity: number, exogenousInsulinBolus: number): number {
  const glucoseDrive = scaleClamped(bloodGlucoseMgDl, INSULIN.SECRETION_THRESHOLD_MGDL, INSULIN.SECRETION_SATURATION_MGDL, 0, 1);
  const endogenous = glucoseDrive * insulinSecretionCapacity;
  return clamp(endogenous + exogenousInsulinBolus, 0, 2);
}
