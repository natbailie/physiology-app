import { GNRH } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Pituitary responsiveness to GnRH (0..1), as a function of how PULSATILE the signal is.
 *
 * This is the counterintuitive centerpiece of the axis: GnRH must arrive in discrete pulses.
 * Too infrequent and the gonadotropes are never driven (hypothalamic amenorrhea). CONTINUOUS
 * exposure is worse still — it downregulates GnRH receptors and shuts the axis down, which is
 * why long-acting GnRH agonists are used as chemical castration despite being agonists.
 */
export function pituitaryResponsiveness(gnrhPulseFrequency: number): number {
  if (gnrhPulseFrequency < GNRH.OPTIMAL_PULSE_FREQUENCY) {
    return scaleClamped(gnrhPulseFrequency, GNRH.MIN_EFFECTIVE_FREQUENCY, GNRH.OPTIMAL_PULSE_FREQUENCY, 0, 1);
  }
  // Past the optimum, an increasingly continuous signal downregulates the receptor.
  return scaleClamped(gnrhPulseFrequency, GNRH.OPTIMAL_PULSE_FREQUENCY, GNRH.CONTINUOUS_THRESHOLD, 1, 0.05);
}

/**
 * Target hypothalamic GnRH drive (0..1). Suppressed by gonadal steroid negative feedback in
 * the usual case, and by any hypothalamic insult (stress, low energy availability). During
 * the positive-feedback window the sign flips and high estrogen DRIVES the axis instead.
 */
export function gnrhDriveTarget(gonadalSteroidFeedback: number, hypothalamicSuppression: number, inPositiveFeedback: boolean): number {
  const suppression = clamp(hypothalamicSuppression / 100, 0, 1);
  const base = inPositiveFeedback ? 0.4 + gonadalSteroidFeedback * 0.6 : 1 - gonadalSteroidFeedback * 0.7;
  return clamp(base * (1 - suppression), 0, 1);
}
