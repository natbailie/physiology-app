import { BASELINE, CLASSIFICATION } from './constants';
import type { Tonicity, VolumeStatus } from './types';

/**
 * Serum sodium from the Edelman relation: (exchangeable Na + exchangeable K) / total body water.
 *
 * Sodium appears in the numerator alongside POTASSIUM, and water is the denominator. Two
 * consequences follow, and between them they explain most sodium disorders. First, serum sodium
 * is a statement about water: add water and it falls, lose water and it rises, whatever the
 * sodium content is doing. Second, potassium depletion lowers serum sodium — which is why
 * replacing potassium in a hypokalaemic, hyponatraemic patient raises the sodium on its own.
 */
export function serumSodium(exchangeableSodiumMeq: number, exchangeablePotassiumMeq: number, totalBodyWaterL: number): number {
  return (exchangeableSodiumMeq + exchangeablePotassiumMeq) / Math.max(totalBodyWaterL, 1);
}

/**
 * How total body water divides between the compartments. Water is free to cross cell membranes,
 * so it distributes until the two sides are iso-osmolar; the split is therefore fixed by how
 * many osmoles each compartment holds. Sodium salts hold the ECF open, potassium salts the ICF.
 * The familiar one-third / two-thirds split is a RESULT of those contents, not a rule.
 */
export function ecfVolume(exchangeableSodiumMeq: number, exchangeablePotassiumMeq: number, totalBodyWaterL: number): number {
  const totalCation = exchangeableSodiumMeq + exchangeablePotassiumMeq;
  if (totalCation <= 0) return 0;
  return totalBodyWaterL * (exchangeableSodiumMeq / totalCation);
}

export function serumPotassium(ecfPotassiumMeq: number, ecfVolumeL: number): number {
  return ecfPotassiumMeq / Math.max(ecfVolumeL, 0.5);
}

/** Measured osmolality — sodium and its anions, plus glucose and urea. */
export function serumOsmolality(serumSodiumMeqL: number, serumGlucoseMgDl: number): number {
  return 2 * serumSodiumMeqL + serumGlucoseMgDl / 18 + 5;
}

/**
 * Effective osmolality (tonicity) — only the osmoles that cannot cross cell membranes and can
 * therefore actually move water. Urea crosses freely, so it raises measured osmolality without
 * pulling any water: a uraemic patient can be hyperosmolar and perfectly isotonic.
 */
export function effectiveOsmolality(serumSodiumMeqL: number, serumGlucoseMgDl: number): number {
  return 2 * serumSodiumMeqL + serumGlucoseMgDl / 18;
}

/**
 * What the sodium would read if glucose were normal. Glucose is an effective osmole trapped
 * outside cells, so it pulls water out and dilutes sodium — the sodium is not the problem, and
 * treating the glucose fixes it.
 */
export function correctedSodium(serumSodiumMeqL: number, serumGlucoseMgDl: number): number {
  const excess = Math.max(0, serumGlucoseMgDl - 100);
  return serumSodiumMeqL + (CLASSIFICATION.GLUCOSE_CORRECTION_PER_100 * excess) / 100;
}

export function volumeStatus(ecfVolumeL: number): VolumeStatus {
  const ratio = ecfVolumeL / BASELINE.ECF_VOLUME_L;
  if (ratio < CLASSIFICATION.HYPOVOLEMIC_RATIO) return 'hypovolemic';
  if (ratio > CLASSIFICATION.HYPERVOLEMIC_RATIO) return 'hypervolemic';
  return 'euvolemic';
}

export function tonicity(effectiveOsm: number): Tonicity {
  if (effectiveOsm < CLASSIFICATION.HYPOTONIC_OSMOLALITY) return 'hypotonic';
  if (effectiveOsm > CLASSIFICATION.HYPERTONIC_OSMOLALITY) return 'hypertonic';
  return 'isotonic';
}
