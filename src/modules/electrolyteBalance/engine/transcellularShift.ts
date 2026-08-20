import { BASELINE, TRANSCELLULAR } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Where potassium sits relative to the cell membrane — expressed as the ECF's share of total
 * body potassium, normally about 1.4%.
 *
 * Because that share is so small, moving a few percent of the intracellular pool across the
 * membrane transforms the serum level while total body potassium does not change by a single
 * milliequivalent. This is why the serum potassium is such an unreliable guide to potassium
 * STORES, and why the treatments that work fastest in hyperkalaemia — insulin, salbutamol —
 * fix the number without removing any potassium from the body at all.
 *
 * Insulin and beta-2 agonists stimulate the Na+/K+-ATPase and drive potassium IN. Acidaemia
 * drives it OUT as hydrogen ions are buffered intracellularly in exchange. Hypertonicity drags
 * it out with the water leaving the cell.
 */
export function targetEcfPotassiumFraction(
  insulinLevel: number,
  beta2Activity: number,
  arterialPH: number,
  effectiveOsmolality: number,
): number {
  const insulinEffect = 1 - TRANSCELLULAR.INSULIN_GAIN * Math.log(1 + Math.max(0, insulinLevel - 1));
  const beta2Effect = 1 - TRANSCELLULAR.BETA2_GAIN * Math.log(1 + Math.max(0, beta2Activity - 1));
  const phEffect = 1 + TRANSCELLULAR.PH_GAIN_PER_UNIT * (7.4 - arterialPH);
  const tonicityEffect = 1 + TRANSCELLULAR.TONICITY_GAIN * (effectiveOsmolality - 2 * BASELINE.SERUM_SODIUM_MEQ_L - 5);

  const multiplier = clamp(
    insulinEffect * beta2Effect * phEffect * tonicityEffect,
    TRANSCELLULAR.MIN_FRACTION_MULTIPLIER,
    TRANSCELLULAR.MAX_FRACTION_MULTIPLIER,
  );
  return TRANSCELLULAR.BASE_ECF_FRACTION * multiplier;
}
