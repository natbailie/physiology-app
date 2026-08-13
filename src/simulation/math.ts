export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation of `value` from [inMin, inMax] to [outMin, outMax], clamped to the output range. */
export function scaleClamped(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
}

/**
 * Exponential first-order relaxation of `current` toward `target` over `dtSeconds`,
 * with time constant `tauSeconds`. This is what gives reflex/hormone actuators their
 * latency and — critically — damps the feedback loop so it settles instead of
 * oscillating between per-tick extremes.
 */
export function approach(current: number, target: number, dtSeconds: number, tauSeconds: number): number {
  const t = clamp(dtSeconds / tauSeconds, 0, 1);
  return current + (target - current) * t;
}
