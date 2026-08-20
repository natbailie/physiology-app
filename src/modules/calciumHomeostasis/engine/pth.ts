import { PTH } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Magnesium's permissive gate on PTH (0..1). Magnesium is required both for PTH secretion
 * and for PTH's action at bone/kidney, so severe hypomagnesemia produces the counterintuitive
 * picture of hypocalcemia with an *inappropriately low* PTH — and calcium that stays
 * refractory to replacement until the magnesium itself is corrected.
 */
export function magnesiumGate(serumMagnesium: number): number {
  return scaleClamped(serumMagnesium, PTH.MG_CRITICAL_MGDL, PTH.MG_ADEQUATE_MGDL, 0, 1);
}

/**
 * Target PTH level (0..1): an inverse sigmoid of serum calcium (low calcium → high PTH),
 * scaled by gland capacity and the magnesium gate, plus any autonomous (adenoma) secretion
 * that bypasses calcium feedback entirely — the mechanism behind primary hyperparathyroidism.
 */
export function pthLevelTarget(
  serumCalciumMgDl: number,
  parathyroidGlandFunction: number,
  serumMagnesium: number,
  autonomousPTHSecretion: number,
): number {
  const calciumDrive = scaleClamped(serumCalciumMgDl, PTH.SECRETION_FLOOR_CA_MGDL, PTH.SECRETION_CEILING_CA_MGDL, 1, 0);
  const regulated = calciumDrive * parathyroidGlandFunction * magnesiumGate(serumMagnesium);
  const autonomous = clamp(autonomousPTHSecretion / 100, 0, 1) * magnesiumGate(serumMagnesium);
  return clamp(regulated + autonomous, 0, 1);
}
