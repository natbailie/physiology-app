import { FEMALE } from './constants';
import type { CyclePhase } from './types';

/** Advances the menstrual cycle clock, wrapping at the end of each cycle. */
export function advanceCycle(cycleDayFraction: number, dtSeconds: number): number {
  return (cycleDayFraction + dtSeconds / FEMALE.CYCLE_PERIOD_SECONDS) % 1;
}

/** True during the follicular (pre-ovulatory) half of the cycle. */
export function inFollicularPhase(cycleDayFraction: number): boolean {
  return cycleDayFraction < FEMALE.FOLLICULAR_FRACTION;
}

/** Cycle day 1-28 for display. */
export function cycleDay(cycleDayFraction: number): number {
  return Math.floor(cycleDayFraction * 28) + 1;
}

/**
 * Names the current phase. Note that ovulation is reported from the positive-feedback state
 * rather than from the calendar — the phase label follows the hormonal event, not the other
 * way round.
 */
export function cyclePhaseName(cycleDayFraction: number, inPositiveFeedback: boolean, corpusLuteumActivity: number): CyclePhase {
  if (inPositiveFeedback) return 'ovulation';
  if (corpusLuteumActivity > 0.15) return 'luteal';
  if (cycleDayFraction < 0.18) return 'menstrual';
  return 'follicular';
}
