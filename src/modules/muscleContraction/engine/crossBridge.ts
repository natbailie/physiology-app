import { CROSS_BRIDGE, MUSCLE_TYPES } from './constants';
import { clamp } from '@/shared/lib/math';
import type { MuscleType } from './types';

/**
 * The fraction of regulatory sites activated by the current calcium concentration, as a Hill
 * function. Cooperativity (n ≈ 3-4) is what makes this steep: a small rise in calcium produces
 * a large rise in activation, so the muscle behaves as a switch rather than a rheostat.
 *
 * In skeletal and cardiac muscle this is calcium binding to troponin-C, moving tropomyosin off
 * the myosin binding sites. In smooth muscle there is no troponin at all — calcium binds
 * calmodulin, which activates myosin light chain kinase, which phosphorylates the myosin head.
 * Different molecules, same shape of curve, and the same place in the causal chain.
 */
export function troponinOccupancy(cytosolicCalciumUM: number, muscleType: MuscleType): number {
  const { activationHillN, activationHalfUM } = MUSCLE_TYPES[muscleType];
  const ca = Math.max(0, cytosolicCalciumUM) ** activationHillN;
  const half = activationHalfUM ** activationHillN;
  return ca / (ca + half);
}

/**
 * Time constant for the attached cross-bridge fraction to move toward its target.
 *
 * Attachment is fast and set by the biochemistry of the head. Detachment requires ATP to bind
 * myosin and break the rigor complex, so the detachment tau is the base value DIVIDED by ATP
 * availability: as ATP falls the muscle relaxes more and more slowly, and at zero ATP the
 * heads never let go at all. Smooth muscle's latch bridges detach slowly by design.
 */
export function crossBridgeTau(isAttaching: boolean, atpAvailability: number): number {
  if (isAttaching) return CROSS_BRIDGE.ATTACH_TAU_SECONDS;
  return CROSS_BRIDGE.DETACH_TAU_SECONDS / Math.max(atpAvailability, CROSS_BRIDGE.ATP_FLOOR);
}

/**
 * Smooth muscle's latch state: heads that have been dephosphorylated but have not yet detached.
 * They hold tension almost indefinitely at a fraction of the ATP cost of active cycling, which
 * is how a sphincter or an arteriole maintains tone for hours. Zero in striated muscle.
 */
export function latchTarget(activeCrossBridgeFraction: number, muscleType: MuscleType): number {
  if (!MUSCLE_TYPES[muscleType].latchCapable) return 0;
  return activeCrossBridgeFraction < CROSS_BRIDGE.LATCH_THRESHOLD ? 0 : activeCrossBridgeFraction;
}

/** Total force-generating fraction: actively cycling bridges plus any latch bridges. */
export function activationFraction(activeCrossBridgeFraction: number, latchFraction: number): number {
  return clamp(Math.max(activeCrossBridgeFraction, latchFraction), 0, 1);
}

/** Rigor: bridges still attached with no ATP available to release them. */
export function isInRigor(activeCrossBridgeFraction: number, atpAvailability: number): boolean {
  return atpAvailability < CROSS_BRIDGE.RIGOR_ATP_THRESHOLD && activeCrossBridgeFraction > CROSS_BRIDGE.RIGOR_BRIDGE_THRESHOLD;
}
