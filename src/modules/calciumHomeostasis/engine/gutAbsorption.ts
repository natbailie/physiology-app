import { GUT } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Fraction of dietary calcium absorbed: calcitriol is the dominant regulator (it induces the
 * calcium-binding proteins the gut needs). Passive absorption continues at a low basal rate
 * even with no calcitriol at all, which is why calcium supplementation still helps somewhat
 * in vitamin D deficiency — just far less efficiently.
 */
export function gutCaAbsorptionFraction(calcitriolLevel: number): number {
  return clamp(GUT.BASAL_CA_ABSORPTION + calcitriolLevel * GUT.CALCITRIOL_CA_ABSORPTION_GAIN, 0, 0.6);
}

/** Fraction of dietary phosphate absorbed: also calcitriol-enhanced — calcitriol raises gut
 * absorption of BOTH ions, unlike PTH, which raises calcium while dumping phosphate. */
export function gutPhosphateAbsorptionFraction(calcitriolLevel: number): number {
  return clamp(GUT.BASAL_PHOSPHATE_ABSORPTION + calcitriolLevel * GUT.CALCITRIOL_PHOSPHATE_ABSORPTION_GAIN, 0, 0.9);
}

export function gutCalciumInflux(dietaryCalciumIntake: number, absorptionFraction: number): number {
  return (dietaryCalciumIntake / GUT.INTAKE_SCALE_MG) * absorptionFraction * GUT.CA_INTAKE_FLUX_GAIN;
}

export function gutPhosphateInflux(dietaryPhosphateIntake: number, absorptionFraction: number): number {
  return (dietaryPhosphateIntake / GUT.INTAKE_SCALE_MG) * absorptionFraction * GUT.PHOSPHATE_INTAKE_FLUX_GAIN;
}
