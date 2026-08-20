import { MEAL } from './constants';

/** Fraction of the remaining meal bolus absorbed per second — a simple exponential-decay
 * approximation of carbohydrate digestion and absorption. */
export function mealAbsorptionRateGramsPerSecond(mealBolusRemaining: number): number {
  return mealBolusRemaining * MEAL.ABSORPTION_RATE_PER_SECOND;
}
