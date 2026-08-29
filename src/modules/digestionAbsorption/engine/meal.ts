import { BILE, MEAL } from './constants';
import { clamp } from '@/shared/lib/math';

/** How much of the demanded emulsification the current pool can deliver. A small meal is fine
 * with a modest pool; a fatty one demands nearly all of it. */
export function bileEmulsificationFactor(bileSaltPoolG: number, mealFatGrams: number): number {
  const adequateForMeal = BILE.EMULSIFY_ADEQUACY_BASE_G + BILE.EMULSIFY_ADEQUACY_PER_G_FAT * Math.max(mealFatGrams, 0);
  return clamp(bileSaltPoolG / Math.max(adequateForMeal, 1e-6), 0, 1);
}

/** Enzyme capacity with the huge pancreatic reserve built in: anything above ~10% of normal
 * lipase absorbs a meal completely; below it, failure is proportional and merciless. */
export function enzymeFactor(pancreaticEnzymeCapacityPct: number): number {
  return clamp(
    pancreaticEnzymeCapacityPct / 100 / (MEAL.ENZYME_STEATORRHOEA_RESERVE / 100),
    0,
    1,
  );
}

/**
 * Fat absorption efficiency for the current meal.
 *
 * Multiplicative at the core: no bile means the lipase has no emulsion to work on, and no
 * lipase means the emulsion sits untouched — so EITHER failing alone abolishes uptake, which
 * is exactly why both bile-duct obstruction and pancreatic insufficiency present with
 * greasy stool despite entirely different organs.
 */
export function fatAbsorptionEfficiency(params: {
  bileFactor: number;
  enzymeFactor: number;
  mucosalSurfaceAreaPct: number;
  transitMultiplier: number;
}): number {
  const surface = Math.pow(clamp(params.mucosalSurfaceAreaPct / 100, 0, 1), MEAL.SURFACE_EXPONENT);
  const hurry = Math.pow(clamp(1 / Math.max(params.transitMultiplier, 0.05), 0, 2), MEAL.TRANSIT_EXPONENT);
  return clamp(params.bileFactor * params.enzymeFactor * surface * hurry, 0, 1);
}

/** Lactose follows its brush-border enzyme: capacity against load, linearly. Most of the
 * world's adults run near 15% of childhood activity and tolerate small loads only. */
export function lactoseAbsorbedFraction(lactaseActivityPct: number): number {
  return clamp(lactaseActivityPct / 100, 0, 1);
}

/** General (non-lactose) nutrient uptake rides on surface area alone; amylase and proteases
 * are rarely what limits carbohydrate and protein absorption in practice. */
export function generalNutrientEfficiency(mucosalSurfaceAreaPct: number, transitMultiplier: number): number {
  const surface = Math.pow(clamp(mucosalSurfaceAreaPct / 100, 0, 1), MEAL.SURFACE_EXPONENT);
  const hurry = Math.pow(clamp(1 / Math.max(transitMultiplier, 0.05), 0, 2), MEAL.TRANSIT_EXPONENT);
  return clamp(surface * hurry, 0, 1);
}

/** Luminal load decays by transit: what is absorbed or passed stops being luminal. */
export function transitedFraction(dtSeconds: number): number {
  const tauSeconds = MEAL.TRANSIT_TAU_HOURS * 3600;
  return clamp(dtSeconds / tauSeconds, 0, 1);
}
