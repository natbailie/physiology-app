import { BAROREFLEX, HEMODYNAMICS } from './constants';
import { clamp } from './math';

/**
 * Target baroreflex drive: normalized -1..1 signal from how far the given MAP is
 * below (positive) or above (negative) the setpoint. Positive drive means
 * "sympathetic activation" — raise heart rate and vascular tone to restore pressure.
 * The engine relaxes the actual (smoothed) drive toward this target on
 * BAROREFLEX.TAU_SECONDS rather than snapping to it.
 */
export function baroreflexDrive(map: number): number {
  const error = HEMODYNAMICS.MAP_SETPOINT - map;
  return clamp(error / BAROREFLEX.SENSITIVITY_RANGE, -1, 1);
}

export function effectiveHeartRate(sliderHeartRate: number, drive: number): number {
  const adjusted = sliderHeartRate + drive * BAROREFLEX.MAX_HEART_RATE_ADJUST;
  return clamp(adjusted, HEMODYNAMICS.HEART_RATE_MIN, HEMODYNAMICS.HEART_RATE_MAX);
}

export function baroreflexToneMultiplier(drive: number): number {
  return 1 + drive * BAROREFLEX.MAX_TONE_ADJUST;
}
