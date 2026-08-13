import { ANP } from './constants';
import { clamp } from './math';

/**
 * ANP level (0-1): released when atrial stretch (approximated by preload factor)
 * exceeds a threshold — i.e. hypervolemia. Opposes RAAS: mild vasodilation and
 * increased natriuresis.
 */
export function anpLevel(currentPreloadFactor: number): number {
  const excess = currentPreloadFactor - ANP.PRELOAD_THRESHOLD;
  return clamp(excess / ANP.SENSITIVITY, 0, 1);
}

export function anpToneReliefMultiplier(level: number): number {
  return 1 - level * ANP.TONE_RELIEF_GAIN;
}

export function anpNatriuresisBoost(level: number): number {
  return level * ANP.NATRIURESIS_GAIN;
}
