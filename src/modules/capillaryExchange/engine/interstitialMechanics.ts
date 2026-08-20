import { INTERSTITIAL, TISSUE_BEDS } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import type { TissueBed } from './types';

/**
 * Interstitial hydrostatic pressure as a function of how full the interstitium is.
 *
 * Normal interstitial pressure is NEGATIVE — about −3 mmHg — because the lymphatics hold the
 * tissue slightly suctioned. That negative pressure is what keeps tissues compacted, and in the
 * lung it is what keeps the alveoli dry.
 *
 * The curve has two phases. While fluid is still bound in the gel matrix, the tissue is stiff
 * and pressure rises steeply with volume — this back-pressure is the single largest safety
 * factor against oedema, worth around 7 mmHg. Once the gel is saturated, free fluid appears,
 * compliance becomes enormous, and pressure barely rises however much more arrives. That is why
 * oedema seems to appear all at once: nothing visible happens until the gel is full, and then
 * everything happens.
 */
export function interstitialPressure(interstitialExcess: number, interstitialCompliance: number, tissueBed: TissueBed): number {
  const base = TISSUE_BEDS[tissueBed].baselineInterstitialPressureMmHg;
  const compliance = Math.max(interstitialCompliance, 0.05);
  const gelLimit = INTERSTITIAL.GEL_CAPACITY_FRACTION;

  const rise =
    interstitialExcess <= gelLimit
      ? interstitialExcess * INTERSTITIAL.GEL_PRESSURE_GAIN_MMHG
      : gelLimit * INTERSTITIAL.GEL_PRESSURE_GAIN_MMHG + (interstitialExcess - gelLimit) * INTERSTITIAL.FREE_FLUID_PRESSURE_GAIN_MMHG;

  return clamp(base + rise / compliance, INTERSTITIAL.MIN_PRESSURE_MMHG, INTERSTITIAL.MAX_PRESSURE_MMHG);
}

/** Free fluid, and therefore pitting, once the gel matrix is saturated. */
export function isPitting(interstitialExcess: number, interstitialCompliance: number): boolean {
  return interstitialExcess > INTERSTITIAL.PITTING_EXCESS * Math.max(interstitialCompliance, 0.05);
}

/** Clinically visible swelling, scaled against how much this particular bed can tolerate. The
 * lung tolerates almost nothing; a dependent limb tolerates a great deal. */
export function oedemaSeverity(interstitialExcess: number, tissueBed: TissueBed): number {
  const tolerance = TISSUE_BEDS[tissueBed].toleranceExcess;
  return scaleClamped(interstitialExcess, tolerance * 0.3, tolerance * 1.5, 0, 1);
}
