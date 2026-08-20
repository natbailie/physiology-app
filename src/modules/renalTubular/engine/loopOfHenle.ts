import { TUBULE } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import type { NephronSegment } from './types';

/** Peak medullary interstitial osmolality for a given gradient strength. */
export function medullaryTipOsmolality(gradientStrength: number): number {
  return scaleClamped(gradientStrength, 0, 1, TUBULE.FILTRATE_OSMOLALITY, TUBULE.DESCENDING_MAX_OSMOLALITY);
}

/**
 * Descending thin limb: water-permeable but solute-impermeable. As it dips into the
 * hypertonic medulla, water is osmotically drawn OUT, so the tubular fluid concentrates
 * toward the surrounding interstitial osmolality. Nothing is actively pumped here — this
 * segment is a passive equilibrator.
 */
export function descendingLimb(entering: NephronSegment, gradientStrength: number): NephronSegment {
  const tipOsmolality = medullaryTipOsmolality(gradientStrength);
  const osmolality = clamp(
    entering.osmolality + (tipOsmolality - entering.osmolality) * TUBULE.DESCENDING_WATER_REMOVAL_FRACTION * 2,
    entering.osmolality,
    tipOsmolality,
  );
  // Volume shrinks in proportion to how much the fluid concentrated (solute is conserved).
  const flowFraction = entering.flowFraction * (entering.osmolality / Math.max(osmolality, 1));

  return { label: 'Descending limb', osmolality, flowFraction };
}

/**
 * Thick ascending limb — the "diluting segment", and the engine of the whole countercurrent
 * multiplier. NKCC2 pumps NaCl out into the interstitium while the segment stays IMPERMEABLE
 * to water, so two things happen at once: the tubular fluid leaving is HYPOTONIC (below
 * plasma) no matter how concentrated it was on the way down, and the solute deposited builds
 * the medullary gradient that the descending limb and collecting duct both depend on.
 *
 * Loop diuretics block NKCC2, which is why they abolish BOTH the dilution here and, over
 * time, the medullary gradient itself — a double hit on urinary concentrating ability.
 */
export function ascendingLimb(entering: NephronSegment, loopDiureticDose: number): NephronSegment {
  const pumpCapacity = clamp(1 - loopDiureticDose / 100, 0, 1);
  const dilutionStrength = TUBULE.ASCENDING_DILUTION_STRENGTH * pumpCapacity;
  const osmolality = clamp(
    entering.osmolality - (entering.osmolality - TUBULE.ASCENDING_MIN_OSMOLALITY) * dilutionStrength,
    TUBULE.ASCENDING_MIN_OSMOLALITY,
    entering.osmolality,
  );

  // Water-impermeable: volume is unchanged through this segment, only solute leaves.
  return { label: 'Ascending limb', osmolality, flowFraction: entering.flowFraction };
}

/** How hard the thick ascending limb is currently pumping (0..1) — the term that both builds
 * and, when it falls, allows washout of the medullary gradient. */
export function ascendingPumpActivity(loopDiureticDose: number): number {
  return clamp(1 - loopDiureticDose / 100, 0, 1);
}
