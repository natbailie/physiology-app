import { BASELINE, CLASSIFICATION } from './constants';
import type { Tonicity, VolumeStatus } from './types';

/**
 * Glucose in excess of the reference, as mOsm/L of ECF water.
 *
 * Without insulin glucose cannot enter cells, so above the reference it behaves as an osmole
 * trapped in the ECF — one that holds water outside cells the way sodium salts do. Below the
 * reference it is already baked into the Edelman fit and displaces nothing. Dividing mg/dL by
 * 18 gives mmol/L, and glucose is a single undissociated particle, so that is mOsm/L directly.
 */
export function excessGlucoseOsmolality(serumGlucoseMgDl: number): number {
  return Math.max(0, serumGlucoseMgDl - CLASSIFICATION.GLUCOSE_OSMOTIC_REFERENCE_MG_DL) / 18;
}

/**
 * How total body water divides between the compartments. Water is free to cross cell membranes,
 * so it distributes until the two sides are iso-osmolar; the split is therefore fixed by how
 * many osmoles each compartment holds. Sodium salts hold the ECF open, potassium salts the ICF.
 * The familiar one-third / two-thirds split is a RESULT of those contents, not a rule.
 *
 * Excess glucose is the third term, and the only one that moves water with nothing entering or
 * leaving the body. Adding it to the ECF side pulls water out of cells until the compartments
 * are iso-osmolar again: the ECF expands, the ICF shrinks, total body water does not change at
 * all. Everything hyperglycaemia does to serum sodium comes from this line.
 *
 * Solving `ecfOsm/V = icfOsm/(TBW − V)` with the glucose term gives a quadratic in V, written
 * here in the form that stays stable as the glucose term goes to zero — where it degenerates
 * exactly to the linear split `TBW · Na/(Na + K)`.
 */
export function ecfVolume(
  exchangeableSodiumMeq: number,
  exchangeablePotassiumMeq: number,
  totalBodyWaterL: number,
  serumGlucoseMgDl: number,
): number {
  // Each cation holds an accompanying anion in its compartment, so it contributes twice over.
  const ecfCationOsmoles = 2 * exchangeableSodiumMeq;
  const icfCationOsmoles = 2 * exchangeablePotassiumMeq;
  if (ecfCationOsmoles <= 0 || totalBodyWaterL <= 0) return 0;

  const glucoseOsm = excessGlucoseOsmolality(serumGlucoseMgDl);
  const linearTerm = ecfCationOsmoles + icfCationOsmoles - glucoseOsm * totalBodyWaterL;
  const discriminant = Math.sqrt(linearTerm * linearTerm + 4 * glucoseOsm * ecfCationOsmoles * totalBodyWaterL);
  return (2 * ecfCationOsmoles * totalBodyWaterL) / Math.max(linearTerm + discriminant, 1e-9);
}

/**
 * Serum sodium — the ECF sodium content divided by the water the ECF is currently holding.
 *
 * At normal glucose this is algebraically identical to the Edelman relation,
 * (exchangeable Na + exchangeable K) / total body water, because that is what the split above
 * collapses to. Two consequences follow, and between them they explain most sodium disorders.
 * First, serum sodium is a statement about water: add water and it falls, lose water and it
 * rises, whatever the sodium content is doing. Second, sodium sits in that numerator alongside
 * POTASSIUM, so potassium depletion lowers serum sodium — which is why replacing potassium in a
 * hypokalaemic, hyponatraemic patient raises the sodium on its own.
 *
 * The third route is the one the Edelman form cannot show, because it changes neither the
 * cations nor total body water: hyperglycaemia widens the denominator by pulling water out of
 * cells, and the sodium falls with nothing wrong with the sodium at all. That is translocational
 * hyponatraemia, and `correctedSodium` is how it is told apart from the real thing.
 */
export function serumSodium(
  exchangeableSodiumMeq: number,
  exchangeablePotassiumMeq: number,
  totalBodyWaterL: number,
  serumGlucoseMgDl: number,
): number {
  const ecf = ecfVolume(exchangeableSodiumMeq, exchangeablePotassiumMeq, totalBodyWaterL, serumGlucoseMgDl);
  return exchangeableSodiumMeq / Math.max(ecf, 0.5);
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
 *
 * This is the bedside rule, not the inverse of the compartment maths above: it adds back a flat
 * 1.6 mEq/L per 100 mg/dL, where the real displacement is mildly non-linear and nearer 1.8-2.0.
 * The two are applied to different things and so cannot double-count — `serumSodium` has
 * already taken the water out of the cells, and this only reads back what that cost. The small
 * residual gap is the rule's own approximation error, and it is the reason a corrected sodium
 * lands near 140 rather than exactly on it.
 */
export function correctedSodium(serumSodiumMeqL: number, serumGlucoseMgDl: number): number {
  const excess = Math.max(0, serumGlucoseMgDl - CLASSIFICATION.GLUCOSE_OSMOTIC_REFERENCE_MG_DL);
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
