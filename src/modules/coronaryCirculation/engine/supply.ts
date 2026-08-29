import { SUPPLY, TIMING } from './constants';
import { clamp } from '@/shared/lib/math';

/** The pressure the coronary vessels must work against even at zero flow: the muscle closes its
 * own intramyocardial channels, and a stiff, over-filled ventricle closes them harder. */
export function closingPressureMmHg(lvedpMmHgValue: number): number {
  return SUPPLY.PZF_BASE_MMHG + SUPPLY.PZF_LVEDP_FRACTION * lvedpMmHgValue;
}

/** Diastolic driving pressure: the aortic head minus the closing pressure. */
export function diastolicDriving(aorticDiastolicMmHg: number, closingPressure: number): number {
  return Math.max(0, aorticDiastolicMmHg - closingPressure);
}

/** Effective driving pressure across the whole cycle. Diastole carries the flow; the small
 * systolic share reflects what survives early systole and on the right side of the septum. */
export function effectiveDriving(diastolicDrivingMmHg: number, diastolicTimeFraction: number): number {
  const diastolicShare =
    diastolicTimeFraction + (1 - diastolicTimeFraction) * TIMING.SYSTOLE_PATENCY_SHARE;
  return diastolicDrivingMmHg * diastolicShare;
}

/** Oxygen carriage relative to the reference blood: flow is only half of delivery —
 * anaemia and desaturation starve the myocardium with perfectly open arteries. */
export function oxygenCarriageRatio(haemoglobinGPerDl: number, saturationPct: number): number {
  const numerator = Math.max(haemoglobinGPerDl, 0) * clamp(saturationPct / 100, 0, 1);
  const denominator = SUPPLY.HAEMOGLOBIN_REF_G_PER_DL * (SUPPLY.SAO2_REF_PCT / 100);
  return numerator / denominator;
}

/** Maximal delivery of a lesion-free circulation: full vasodilatory conductance against the
 * effective driving pressure, expressed as a multiple of normal resting flow. */
export function freeMaximalFlow(effectiveDrivingPressureMmHg: number): number {
  return (
    SUPPLY.MAX_RESERVE_FACTOR *
    (effectiveDrivingPressureMmHg / SUPPLY.EFFECTIVE_DRIVING_REF_MMHG)
  );
}
