import { CORRECTION } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import type { Tonicity, VolumeStatus } from './types';

/**
 * Risk of osmotic demyelination — the injury caused by the TREATMENT rather than the disease.
 *
 * A brain that has been hyponatraemic for more than a day or two has exported organic osmolytes
 * to avoid swelling. Raise the serum sodium faster than it can replace them and the cells shrink
 * catastrophically. The danger is therefore a function of the RATE of correction and of how low
 * the sodium was to begin with — never of the sodium value on its own. A sodium of 110 corrected
 * at 6 mEq/L/day is safe; the same sodium corrected at 20 is not.
 */
export function demyelinationRisk(sodiumChangeRateMeqLPerDay: number, adaptedSodiumMeqL: number): number {
  // Vulnerability is a property of the ADAPTED sodium — the level the brain has equilibrated to
  // — not of the current reading. A patient corrected from 110 to 145 in a day is at their most
  // dangerous precisely when the number finally looks normal.
  if (adaptedSodiumMeqL > CORRECTION.CHRONIC_HYPONATREMIA_THRESHOLD + 15) return 0;
  const vulnerability = scaleClamped(adaptedSodiumMeqL, CORRECTION.CHRONIC_HYPONATREMIA_THRESHOLD + 15, 105, 0, 1);
  const excess = scaleClamped(
    sodiumChangeRateMeqLPerDay,
    CORRECTION.SAFE_SODIUM_RATE_MEQ_L_PER_DAY,
    CORRECTION.DANGEROUS_SODIUM_RATE_MEQ_L_PER_DAY,
    0,
    1,
  );
  return clamp(vulnerability * excess, 0, 1);
}

/**
 * The bedside algorithm, run automatically: tonicity first (is this a real water problem at
 * all?), then volume status (which decides the mechanism and the treatment), then the urine.
 * Running it in this order is what separates a pseudohyponatraemia from a genuine one, and
 * SIADH — where treatment is water restriction — from hypovolaemia, where it is saline.
 */
export function classifyDisorder(
  serumSodiumMeqL: number,
  serumPotassiumMeqL: number,
  tonicity: Tonicity,
  volumeStatus: VolumeStatus,
  urineOsmolality: number,
  serumGlucoseMgDl: number,
): string {
  if (serumSodiumMeqL < 135) {
    if (tonicity !== 'hypotonic') {
      return serumGlucoseMgDl > 250
        ? 'Non-hypotonic hyponatraemia — dilution by glucose, not a sodium problem'
        : 'Non-hypotonic hyponatraemia — check for another effective osmole';
    }
    if (volumeStatus === 'hypovolemic') return 'Hypotonic hyponatraemia, hypovolaemic — ADH is appropriate; give saline';
    if (volumeStatus === 'hypervolemic') return 'Hypotonic hyponatraemia, hypervolaemic — oedematous state; restrict salt and water';
    return urineOsmolality > 100
      ? 'Hypotonic hyponatraemia, euvolaemic with concentrated urine — SIADH; restrict water'
      : 'Hypotonic hyponatraemia with dilute urine — water intake exceeds excretion';
  }

  if (serumSodiumMeqL > 145) {
    return urineOsmolality < 300
      ? 'Hypernatraemia with inappropriately dilute urine — diabetes insipidus'
      : 'Hypernatraemia with concentrated urine — water loss with inadequate replacement';
  }

  if (serumPotassiumMeqL > 5.5) return 'Hyperkalaemia — check GFR, aldosterone and internal shift';
  if (serumPotassiumMeqL < 3.5) return 'Hypokalaemia — separate renal loss, GI loss and shift using the TTKG';
  return 'Sodium and potassium within normal limits';
}
