import { FORCE_VELOCITY } from './constants';
import type { ContractionMode } from './types';

/**
 * Hill's force-velocity relation: (F + a)(v + b) = (F0 + a)b, rearranged for velocity.
 *
 * The hyperbola falls out of cross-bridge kinetics — a head that is moving spends less of its
 * cycle attached, so a fast-shortening muscle has fewer bridges bearing load at any instant.
 * Its two endpoints are the ones worth remembering: at zero load the muscle shortens at vmax
 * but generates no force, and at a load equal to its maximal isometric tension it generates
 * maximal force but does not shorten at all. Power is zero at both, and peaks near a third of
 * maximal load.
 */
export function shorteningVelocity(maxIsometricTension: number, load: number): number {
  const f0 = Math.max(maxIsometricTension, 1e-6);
  if (load >= f0) return 0;
  const a = FORCE_VELOCITY.A_FRACTION * f0;
  const b = FORCE_VELOCITY.A_FRACTION * FORCE_VELOCITY.VMAX_UM_PER_S;
  return (b * (f0 - Math.max(0, load))) / (Math.max(0, load) + a);
}

/**
 * A contraction is isometric whenever the load equals or exceeds what the muscle can currently
 * develop — including at the very start of every isotonic contraction, before enough tension
 * has built up to lift the load. Tension developed is the lesser of the two.
 */
export function contractionMode(maxIsometricTension: number, load: number): ContractionMode {
  return load >= maxIsometricTension ? 'isometric' : 'isotonic';
}

export function developedTension(maxIsometricTension: number, load: number): number {
  return Math.min(maxIsometricTension, Math.max(0, load));
}
