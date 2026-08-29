import { BILE } from './constants';
import { clamp } from '@/shared/lib/math';

/** Grams of bile salt escaping in stool each day: every cycle spills the un-reabsorbed share
 * of the pool into the colon. This is the number that both depletes the pool and, while it
 * still flows, waters it. */
export function enterohepaticLossGPerDay(bileSaltPoolG: number, ilealReabsorptionFraction: number): number {
  return BILE.CYCLES_PER_DAY * Math.max(bileSaltPoolG, 0) * clamp(1 - clamp(ilealReabsorptionFraction, 0, 1), 0, 1);
}

/**
 * Hepatic synthesis answering demand up to whatever capacity remains.
 *
 * The healthy liver replaces exactly what escapes. An ileum that fails makes the demand
 * enormous, synthesis climbs to its ceiling, and the pool settles wherever supply can no
 * longer chase loss: that settling point IS short-bowel physiology.
 */
export function hepaticSynthesisGPerDay(params: {
  hepaticSynthesisCapacityPct: number;
  ilealReabsorptionFraction: number;
  bileSaltPoolG: number;
}): number {
  const capacity = BILE.SYNTHESIS_MAX_G_PER_DAY * clamp(params.hepaticSynthesisCapacityPct / 100, 0, 1);
  const lossDemand = enterohepaticLossGPerDay(params.bileSaltPoolG, params.ilealReabsorptionFraction);
  // Chase slightly harder as the pool sags, so a recoverable deficit actually recovers.
  const depletionFrac = clamp((BILE.POOL_REF_G - params.bileSaltPoolG) / BILE.POOL_REF_G, 0, 1);
  const chased = lossDemand * (1 + BILE.SYNTHESIS_CHASE_GAIN * depletionFrac);
  return clamp(chased, 0, capacity);
}

export function updatePool(currentG: number, synthesisGPerDay: number, lossGPerDay: number, dtDays: number): number {
  return clamp(currentG + (synthesisGPerDay - lossGPerDay) * dtDays, 0, BILE.POOL_REF_G * 1.2);
}
