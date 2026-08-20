import { RENAL_COMPENSATION } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target renal metabolic compensation drive (-1..1), gated by `capacity` — a patient
 * with capacity=0 (e.g. dialysis-dependent CKD) can't compensate at all regardless of
 * how deranged pH becomes. The slowest actuator in this module (days), mirroring
 * raasActivation being the slowest actuator in the cardiorenal module.
 */
export function renalCompensationDriveTarget(currentPH: number, capacity: number): number {
  const raw = (7.4 - currentPH) / RENAL_COMPENSATION.PH_RANGE;
  return clamp(raw, -1, 1) * capacity;
}
