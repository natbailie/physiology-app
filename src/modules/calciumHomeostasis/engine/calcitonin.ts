import { CALCITONIN } from './constants';
import { scaleClamped } from '@/shared/lib/math';

/**
 * Target calcitonin level (0..1): thyroid C cells respond to hypercalcemia. Deliberately
 * given a small gain relative to PTH/calcitriol — in humans calcitonin is a minor
 * counter-regulatory hormone, which is why removing every C cell during a total
 * thyroidectomy does not cause hypercalcemia.
 */
export function calcitoninLevelTarget(serumCalciumMgDl: number): number {
  return scaleClamped(serumCalciumMgDl, CALCITONIN.ACTIVATION_FLOOR_CA_MGDL, CALCITONIN.ACTIVATION_CEILING_CA_MGDL, 0, 1);
}
