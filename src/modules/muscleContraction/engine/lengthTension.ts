import { LENGTH_TENSION } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Active tension as a function of sarcomere length — the Gordon-Huxley curve, and the clearest
 * structural argument for the sliding filament theory: force tracks the number of cross-bridges
 * that CAN form, which is pure geometry.
 *
 * Ascending limb (below ~2.0 µm): the thin filaments have slid past each other and interfere,
 * and eventually the thick filament collides with the Z-disc. Plateau (2.0-2.2 µm): every
 * myosin head faces an actin site. Descending limb: overlap falls linearly to nothing.
 */
export function lengthTensionFactor(sarcomereLengthUm: number): number {
  const { ZERO_ASCENDING_UM, PLATEAU_START_UM, PLATEAU_END_UM, ZERO_DESCENDING_UM } = LENGTH_TENSION;
  if (sarcomereLengthUm <= ZERO_ASCENDING_UM) return 0;
  if (sarcomereLengthUm < PLATEAU_START_UM) {
    return scaleClamped(sarcomereLengthUm, ZERO_ASCENDING_UM, PLATEAU_START_UM, 0, 1);
  }
  if (sarcomereLengthUm <= PLATEAU_END_UM) return 1;
  return scaleClamped(sarcomereLengthUm, PLATEAU_END_UM, ZERO_DESCENDING_UM, 1, 0);
}

/**
 * Passive tension, % of maximal tension — titin and the connective tissue sheaths resisting
 * stretch. It rises exponentially, and it is the reason an intact muscle in the body is never
 * found far out on the descending limb: the passive element stops it getting there.
 */
export function passiveTension(sarcomereLengthUm: number): number {
  const excess = sarcomereLengthUm - LENGTH_TENSION.PASSIVE_ONSET_UM;
  if (excess <= 0) return 0;
  return LENGTH_TENSION.PASSIVE_SCALE * (Math.exp(excess * LENGTH_TENSION.PASSIVE_EXPONENT) - 1);
}

export function clampSarcomereLength(lengthUm: number): number {
  return clamp(lengthUm, LENGTH_TENSION.MIN_LENGTH_UM, LENGTH_TENSION.MAX_LENGTH_UM);
}
