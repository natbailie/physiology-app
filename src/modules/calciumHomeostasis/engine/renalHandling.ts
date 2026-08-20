import { RENAL_HANDLING } from './constants';
import { clamp } from '@/shared/lib/math';
import { magnesiumGate } from './pth';

/**
 * Fraction of filtered calcium reabsorbed (distal tubule): PTH raises it, conserving calcium.
 * Gated by magnesium, since magnesium is permissive for PTH's action at target tissue and not
 * only for its secretion.
 */
export function renalCaReabsorptionFraction(pthLevel: number, serumMagnesium: number): number {
  const pthAction = pthLevel * magnesiumGate(serumMagnesium) * RENAL_HANDLING.PTH_CA_REABSORPTION_GAIN;
  return clamp(RENAL_HANDLING.BASAL_CA_REABSORPTION + pthAction, 0, RENAL_HANDLING.MAX_CA_REABSORPTION);
}

/**
 * Fraction of filtered phosphate excreted (proximal tubule): PTH is PHOSPHATURIC — it inhibits
 * the NaPi cotransporter, dumping phosphate in the urine. This opposite-direction renal action
 * on the two ions is what makes primary hyperparathyroidism show high calcium with LOW
 * phosphate, while calcitriol (raising gut absorption of both) raises both.
 *
 * Critically, this excretion needs functioning nephrons — in CKD the phosphaturic escape route
 * is blocked, so phosphate accumulates despite (and then further driving) a rising PTH.
 */
export function renalPhosphateExcretionFraction(pthLevel: number, renalFunction: number): number {
  const capacity = clamp(renalFunction, 0, 1);
  const pthAction = pthLevel * RENAL_HANDLING.PTH_PHOSPHATE_EXCRETION_GAIN;
  return clamp((RENAL_HANDLING.BASAL_PHOSPHATE_EXCRETION + pthAction) * capacity, 0, RENAL_HANDLING.MAX_PHOSPHATE_EXCRETION);
}

/**
 * Absolute calcium lost in urine. Deliberately NOT scaled by renal function: as GFR falls the
 * fractional excretion of calcium rises to compensate, so absolute calcium excretion is
 * roughly preserved until very late CKD. Modeling it otherwise would make failing kidneys
 * retain calcium and produce hypercalcemia — the opposite of the hypocalcemia CKD actually causes.
 */
export function renalCalciumLoss(reabsorptionFraction: number): number {
  return RENAL_HANDLING.FILTERED_CA_LOAD * (1 - reabsorptionFraction);
}

export function renalPhosphateLoss(excretionFraction: number): number {
  return RENAL_HANDLING.FILTERED_PHOSPHATE_LOAD * excretionFraction;
}
