import { BAROREFLEX, HEMODYNAMICS } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target baroreflex drive: normalized -1..1 signal from how far the given MAP is
 * below (positive) or above (negative) the setpoint. Positive drive means
 * "sympathetic activation" — raise heart rate and vascular tone to restore pressure.
 * The engine relaxes the actual (smoothed) drive toward this target on
 * BAROREFLEX.TAU_SECONDS rather than snapping to it.
 *
 * Measured against the CURRENT setpoint, which resets slowly toward the prevailing pressure, so
 * this defends against a CHANGE in pressure rather than against a level.
 *
 * SATURATING in the error, not linear in it. The reflex has most of its gain close to the
 * setpoint, which is where a patient lives and where a controller has to do its work; a linear ramp
 * out to 40 mmHg put nearly all of the gain in territory nobody survives. Symmetric, because this
 * reflex also has to slow a heart when pressure runs high.
 */
export function baroreflexDrive(
  map: number,
  setpointMmHg: number = HEMODYNAMICS.MAP_SETPOINT,
  gain = 1,
): number {
  const error = setpointMmHg - map;
  const magnitude = Math.abs(error) / (Math.abs(error) + BAROREFLEX.HALF_ACTIVATION_ERROR_MMHG);
  // The gain scales the reflex's DEPARTURE from its unstimulated output, which here is zero by
  // construction — so it is a plain product. It does not touch `TAU_SECONDS`: gain is how hard the
  // reflex pulls, tau is how fast, and tau is also the damping that stops the loop oscillating
  // between per-tick extremes. Scaling the time constant instead would make a weak reflex a slow
  // one, which is a different patient.
  return clamp(Math.sign(error) * magnitude * clamp(gain, 0, 1.5), -1, 1);
}

export function effectiveHeartRate(sliderHeartRate: number, drive: number): number {
  const adjusted = sliderHeartRate + drive * BAROREFLEX.MAX_HEART_RATE_ADJUST;
  return clamp(adjusted, HEMODYNAMICS.HEART_RATE_MIN, HEMODYNAMICS.HEART_RATE_MAX);
}

export function baroreflexToneMultiplier(drive: number): number {
  return 1 + drive * BAROREFLEX.MAX_TONE_ADJUST;
}
