import { SYSTEMIC } from './constants';
import { clamp } from '@/shared/lib/math';

/** Systemic spillover tracks the total local war — mediators, pus and chronic grumbling —
 * blunted hard by steroids (which is why they mask sepsis). */
export function cytokineTarget(params: {
  mediatorLevel: number;
  neutrophilPopulation: number;
  pusBurden: number;
  chronicInflammationIndex: number;
  steroidDosePct: number;
}): number {
  const localWar =
    params.mediatorLevel * 0.55 + clamp(params.neutrophilPopulation, 0, 2) * 0.3 + clamp(params.pusBurden, 0, 1.5) * 0.5 + params.chronicInflammationIndex * 0.35;
  const steroidBlunt = 1 - 0.78 * clamp(params.steroidDosePct / 100, 0, 1);
  return clamp(localWar * steroidBlunt, 0, 1.4);
}

/** CRP is a single hepatic compartment chasing an IL-6 signal — which gives it both its lag
 * and its fall. A normal CRP six hours into symptoms proves nothing; at forty-eight it speaks. */
export function crpTargetMgL(systemicCytokineLevel: number): number {
  return SYSTEMIC.CRP_MAX_MG_L * Math.pow(clamp(systemicCytokineLevel, 0, 1.4), 1.15);
}

/** Fever as degrees above the 37 °C set-point, riding the same cytokines. */
export function feverOffsetC(systemicCytokineLevel: number): number {
  return SYSTEMIC.FEVER_MAX_C * Math.pow(clamp(systemicCytokineLevel, 0, 1.4), 0.85);
}

export function coreTemperatureC(feverOffsetCValue: number): number {
  return 37 + Math.max(0, feverOffsetCValue);
}

/** The systemic inflammatory response is a pattern, not a diagnosis: here it is the spillover
 * crossing the line where the rest of the body starts paying for one tissue's war. */
export function sirsActive(systemicCytokineLevel: number): boolean {
  return systemicCytokineLevel >= SYSTEMIC.SIRS_CYTOKINE_THRESHOLD;
}
