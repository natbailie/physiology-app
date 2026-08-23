import { ANION_GAP, INTERPRETATION } from './constants';
import type { AcidType } from './types';

/**
 * The anion gap, mEq/L.
 *
 * Every bicarbonate ion consumed by an acid has to be replaced by something, and WHICH anion
 * replaces it is the only thing that separates two acidoses with identical pH and bicarbonate.
 * An organic acid — ketoacid, lactate, salicylate — hands over a proton and leaves its
 * conjugate base in the plasma, so the replacement anion is one nobody measures and the gap
 * widens one-for-one with the bicarbonate lost. Diarrhoea or a renal tubular acidosis loses
 * bicarbonate with chloride taking its place, and chloride IS measured, so the gap never moves.
 *
 * A base load (a negative burden) is not an acid at all and adds no unmeasured anion, which is
 * why the burden is floored at zero here.
 */
export function anionGapMEqL(metabolicAcidBurdenMEqL: number, acidType: AcidType): number {
  if (acidType !== 'anionGap') return ANION_GAP.NORMAL_MEQ_L;
  const organicAnion = Math.max(metabolicAcidBurdenMEqL, 0) * ANION_GAP.ANION_PER_HCO3_LOST;
  return ANION_GAP.NORMAL_MEQ_L + organicAnion;
}

/**
 * The delta ratio: how far the gap has opened compared with how far the bicarbonate has fallen.
 *
 * In a pure organic acidosis the two move together and the ratio sits near 1. A ratio well
 * BELOW 1 means bicarbonate has fallen further than the gap explains — a normal-gap acidosis
 * is present as well. A ratio well ABOVE 2 means the bicarbonate is higher than the gap
 * predicts, so something has been propping it up: a coexisting metabolic alkalosis. This is
 * how a third disorder is found in a patient whose pH looks almost reasonable.
 *
 * Returns 0 when the bicarbonate has barely moved, because the ratio is then a small number
 * divided by a smaller one and means nothing.
 */
export function deltaRatio(anionGap: number, plasmaHCO3: number): number {
  const hco3Fall = INTERPRETATION.NORMAL_HCO3_MEQ_L - plasmaHCO3;
  if (hco3Fall < INTERPRETATION.DELTA_RATIO_MIN_HCO3_CHANGE) return 0;
  const gapRise = anionGap - ANION_GAP.NORMAL_MEQ_L;
  return gapRise / hco3Fall;
}
