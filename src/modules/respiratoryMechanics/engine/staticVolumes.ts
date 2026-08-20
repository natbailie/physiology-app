import { VOLUMES } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Residual volume: the air that cannot be exhaled. Obstruction raises it, because airways
 * collapse during expiration and trap gas behind them — which is why RV and FRC RISE in COPD
 * even as vital capacity falls (hyperinflation).
 */
export function residualVolumeML(airwayResistance: number): number {
  const obstructionSeverity = clamp((airwayResistance - 1) / 19, 0, 1);
  return clamp(
    VOLUMES.BASELINE_RESIDUAL_VOLUME_ML + obstructionSeverity * VOLUMES.AIR_TRAPPING_RV_GAIN,
    VOLUMES.BASELINE_RESIDUAL_VOLUME_ML,
    VOLUMES.MAX_RESIDUAL_VOLUME_ML,
  );
}

/** Vital capacity: the volume movable between full inspiration and full expiration. Stiff
 * (low-compliance) lungs simply cannot be inflated as far, so VC falls — the defining
 * feature of a restrictive pattern. */
export function vitalCapacityML(effectiveComplianceValue: number): number {
  const complianceRatio = effectiveComplianceValue / VOLUMES.BASELINE_COMPLIANCE;
  const scaled = VOLUMES.BASELINE_VITAL_CAPACITY_ML * (1 - VOLUMES.COMPLIANCE_VC_GAIN * (1 - complianceRatio));
  return clamp(scaled, VOLUMES.MIN_VITAL_CAPACITY_ML, VOLUMES.BASELINE_VITAL_CAPACITY_ML * 1.15);
}

/** Functional residual capacity: the resting end-expiratory volume, where inward lung recoil
 * balances outward chest wall recoil. Rises with air trapping. */
export function functionalResidualCapacityML(residual: number): number {
  return residual + (VOLUMES.BASELINE_FRC_ML - VOLUMES.BASELINE_RESIDUAL_VOLUME_ML);
}

/** Total lung capacity = RV + VC. */
export function totalLungCapacityML(residual: number, vitalCapacity: number): number {
  return residual + vitalCapacity;
}
