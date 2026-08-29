import { MICRONUTRIENT } from './constants';
import { clamp } from '@/shared/lib/math';

/** B12 uptake lives at the terminal ileum and nowhere else — the whole point of site
 * specificity. Proximal disease can strip iron and folate while B12 rides untouched. */
export function b12UptakeFraction(terminalIlealFunctionPct: number): number {
  return clamp(terminalIlealFunctionPct / 100, 0, 1);
}

/** Stores drain toward whatever uptake supports; repletion runs slower than loss, as in life. */
export function updateB12Store(current: number, uptakeFraction: number, dtDays: number): number {
  const equilibrium = clamp(uptakeFraction, 0, 1);
  const rate = equilibrium < current ? MICRONUTRIENT.B12_DRAIN_RATE_PER_DAY : MICRONUTRIENT.B12_DRAIN_RATE_PER_DAY * 0.4;
  return clamp(current + (equilibrium - current) * rate * dtDays, 0, 1);
}

/**
 * Iron uptake through proximal mucosa, against a fixed daily turnover. Mucosal regulation
 * gives the healthy gut just enough headroom that coeliac-grade surface loss cannot keep up.
 */
export function updateIronStore(current: number, mucosalSurfaceAreaPct: number, dtDays: number): number {
  const surface = clamp(mucosalSurfaceAreaPct / 100, 0, 1);
  const regulation = clamp(1.6 - current, 0.2, 1.2);
  const uptake = MICRONUTRIENT.IRON_MAX_UPTAKE_PER_DAY * surface * surface * regulation;
  const net = uptake - MICRONUTRIENT.IRON_TURNOVER_PER_DAY;
  return clamp(current + net * dtDays, 0, 1);
}

export function isDeficient(storeFraction: number): boolean {
  return storeFraction < MICRONUTRIENT.DEFICIENT_FRACTION;
}
