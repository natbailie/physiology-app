import { MOTOR_UNIT, MUSCLE_TYPES } from './constants';
import { clamp } from '@/shared/lib/math';
import type { MuscleType } from './types';

/**
 * Whole-muscle force scaling from motor unit recruitment — the second, independent axis of
 * force grading alongside rate coding.
 *
 * The size principle means motor neurons are recruited smallest-first, so the earliest units
 * added are small, slow and weak and the last are large, fast and powerful. Force therefore
 * rises slightly faster than the unit count, which is why fine force control is possible at
 * low effort and impossible near maximum.
 */
export function recruitmentFactor(motorUnitRecruitment: number): number {
  return clamp(motorUnitRecruitment, 0, 1) ** MOTOR_UNIT.RECRUITMENT_EXPONENT;
}

export function activeMotorUnits(motorUnitRecruitment: number): number {
  return Math.round(clamp(motorUnitRecruitment, 0, 1) * MOTOR_UNIT.TOTAL_UNITS);
}

/**
 * The interstimulus interval the muscle actually experiences. Stimuli arriving during the
 * refractory period are discarded, so raising the stimulation frequency past 1/refractory
 * achieves nothing. This single line is why skeletal muscle tetanizes and cardiac muscle
 * cannot: cardiac refractoriness (~250 ms) outlasts the cardiac twitch, so a second
 * contraction can never begin before the first has finished.
 */
export function effectiveStimulusIntervalMs(stimulationFrequencyHz: number, muscleType: MuscleType): number {
  const requested = stimulationFrequencyHz > 0 ? 1000 / stimulationFrequencyHz : Infinity;
  return Math.max(requested, MUSCLE_TYPES[muscleType].refractoryMs);
}

/** Summation begins once a stimulus lands before the previous twitch has fully relaxed. */
export function isTetanic(intervalMs: number, muscleType: MuscleType): boolean {
  return intervalMs < MUSCLE_TYPES[muscleType].twitchDurationMs;
}

/** Fusion — a smooth plateau with no visible ripple — needs a much shorter interval still. */
export function isFused(intervalMs: number, muscleType: MuscleType): boolean {
  return intervalMs < MUSCLE_TYPES[muscleType].twitchDurationMs * 0.35;
}
