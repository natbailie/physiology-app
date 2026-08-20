import { TUBULE } from './constants';
import { clamp } from '@/shared/lib/math';
import { medullaryTipOsmolality } from './loopOfHenle';
import type { NephronSegment } from './types';

/**
 * Distal convoluted tubule: further dilutes the fluid via the thiazide-sensitive NaCl
 * cotransporter. Because this segment handles far less NaCl than the thick ascending limb,
 * blocking it produces a milder natriuresis than a loop diuretic — and, crucially, it leaves
 * the medullary gradient intact, so concentrating ability is preserved.
 */
export function distalTubule(entering: NephronSegment, thiazideDose: number): NephronSegment {
  const transporterCapacity = clamp(1 - thiazideDose / 100, 0, 1);
  const dilutionStrength = TUBULE.DISTAL_DILUTION_STRENGTH * transporterCapacity;
  const osmolality = clamp(
    entering.osmolality - (entering.osmolality - TUBULE.DISTAL_DILUTION_OSMOLALITY) * dilutionStrength,
    TUBULE.DISTAL_DILUTION_OSMOLALITY,
    entering.osmolality,
  );

  return {
    label: 'Distal tubule',
    osmolality,
    flowFraction: entering.flowFraction * (1 - TUBULE.DISTAL_REABSORPTION_FRACTION),
  };
}

/**
 * Total ADH action at the collecting duct (0..1). Endogenous ADH and exogenous desmopressin
 * both act on the SAME V2 receptor, so both are gated by collecting-duct sensitivity — which
 * is exactly what makes the water deprivation test diagnostic. In CENTRAL DI the duct is
 * responsive but no ADH is made, so giving desmopressin concentrates the urine. In
 * NEPHROGENIC DI the duct cannot respond, so desmopressin changes nothing.
 */
export function effectiveADHAction(adhLevel: number, exogenousADH: number, collectingDuctADHSensitivity: number): number {
  const totalSignal = clamp(adhLevel + exogenousADH / 100, 0, 1.5);
  return clamp(totalSignal * clamp(collectingDuctADHSensitivity, 0, 1.5), 0, 1);
}

/**
 * Collecting duct: the final, ADH-controlled step. With no ADH the duct stays water-tight and
 * the dilute fluid arriving from the distal tubule is excreted almost unchanged. With maximal
 * ADH, aquaporin-2 channels insert and water equilibrates with the hypertonic medulla — so the
 * ceiling on urinary concentration is set by the medullary gradient, not by ADH alone. That
 * coupling is why a washed-out medulla blunts concentrating ability even with plenty of ADH.
 */
export function collectingDuct(entering: NephronSegment, adhAction: number, gradientStrength: number): NephronSegment {
  const maxOsmolality = medullaryTipOsmolality(gradientStrength);
  // Squared rather than linear: aquaporin-2 insertion is cooperative, and the measured
  // relationship between plasma ADH and urine osmolality is sigmoidal — low ADH levels barely
  // concentrate the urine at all, and most of the concentrating happens across the upper part
  // of the range. A linear map would make even trace ADH concentrate the urine substantially.
  const waterPermeability = clamp(adhAction, 0, 1) ** 2;
  const osmolality = clamp(
    entering.osmolality + (maxOsmolality - entering.osmolality) * waterPermeability,
    TUBULE.CD_MIN_URINE_OSMOLALITY,
    maxOsmolality,
  );
  // Solute is conserved as water is reabsorbed, so volume falls in proportion to the rise in
  // concentration — floored so that maximal ADH can never reabsorb quite everything.
  const concentrationRatio = entering.osmolality / Math.max(osmolality, 1);
  const flowFraction = entering.flowFraction * clamp(concentrationRatio, 1 - TUBULE.CD_MAX_WATER_REABSORPTION, 1);

  return { label: 'Collecting duct', osmolality, flowFraction };
}
