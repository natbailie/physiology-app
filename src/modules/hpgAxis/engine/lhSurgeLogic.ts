import { FEMALE } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Integrates "sustained high estrogen exposure" for one tick.
 *
 * The switch from negative to positive feedback needs estrogen to be BOTH above a threshold
 * AND to have stayed there for a while — roughly 36-48 hours in reality. Modeling it as an
 * integrator rather than a simple threshold is what makes the surge fire once per cycle: a
 * brief estrogen spike accumulates a little exposure and then decays away harmlessly, while
 * the sustained rise of a maturing follicle eventually crosses the line.
 *
 * This is why the surge emerges from estrogen dynamics rather than being scheduled on a fixed
 * cycle day — and why anything that blunts the follicular estrogen rise (the combined oral
 * contraceptive, hypothalamic amenorrhea) prevents ovulation without having to act on the
 * ovary directly.
 */
export function tickEstrogenExposure(currentExposure: number, estrogenLevel: number, dtSeconds: number): number {
  if (estrogenLevel >= FEMALE.POSITIVE_FEEDBACK_ESTROGEN_THRESHOLD) {
    return clamp(currentExposure + FEMALE.EXPOSURE_ACCUMULATION_PER_SECOND * dtSeconds, 0, FEMALE.EXPOSURE_SURGE_THRESHOLD * 1.5);
  }
  return clamp(currentExposure - FEMALE.EXPOSURE_DECAY_PER_SECOND * dtSeconds, 0, FEMALE.EXPOSURE_SURGE_THRESHOLD * 1.5);
}

/** Whether accumulated exposure has crossed the threshold that flips feedback to positive. */
export function shouldTriggerSurge(exposure: number, alreadyInPositiveFeedback: boolean): boolean {
  return !alreadyInPositiveFeedback && exposure >= FEMALE.EXPOSURE_SURGE_THRESHOLD;
}

/**
 * Whether the positive-feedback window remains open. It closes after a fixed duration —
 * physiologically, ovulation occurs and the ruptured follicle becomes a corpus luteum, whose
 * progesterone promptly restores negative feedback.
 */
export function surgeWindowOpen(secondsSinceSurgeStart: number): boolean {
  return secondsSinceSurgeStart < FEMALE.SURGE_DURATION_SECONDS;
}
