import { ONCOTIC } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Landis-Pappenheimer: colloid osmotic pressure as a function of protein concentration.
 *
 * The relationship is markedly non-linear — the quadratic and cubic terms come from the
 * Gibbs-Donnan effect and from protein molecules getting in each other's way — and that
 * non-linearity matters clinically. Halving the plasma albumin more than halves the oncotic
 * pressure, which is why nephrotic syndrome and liver failure cause oedema so effectively while
 * a modest fall in albumin causes none at all.
 */
export function landisPappenheimer(proteinGDl: number): number {
  const c = clamp(proteinGDl, 0, ONCOTIC.MAX_PROTEIN_G_DL);
  return ONCOTIC.LP_LINEAR * c + ONCOTIC.LP_QUADRATIC * c * c + ONCOTIC.LP_CUBIC * c * c * c;
}

/**
 * Plasma oncotic pressure, computed from the protein actually in the plasma rather than from the
 * albumin slider directly. Two opposite things then follow automatically. Filtering fluid out
 * CONCENTRATES the protein left behind, raising oncotic pressure — a brake on filtration built
 * into the plasma itself. But losing protein through a leaky wall DILUTES it, removing the
 * brake. Which of the two dominates is exactly what separates cardiac oedema from septic oedema.
 */
export function plasmaOncoticPressure(plasmaProteinG: number, plasmaVolumeMl: number): number {
  return landisPappenheimer(proteinConcentrationGDl(plasmaProteinG, plasmaVolumeMl));
}

/**
 * Interstitial oncotic pressure, from the protein actually in the interstitium. This is the
 * second safety factor against oedema: filtered fluid is nearly protein-free, so as the
 * interstitium fills, its protein is diluted, its oncotic pressure falls, and the force pulling
 * fluid OUT of the capillary weakens. The interstitium washes its own protein out.
 */
export function interstitialOncoticPressure(interstitialProteinGDl: number): number {
  return landisPappenheimer(interstitialProteinGDl);
}

export function proteinConcentrationGDl(proteinG: number, volumeMl: number): number {
  return (proteinG / Math.max(volumeMl, 1)) * 100;
}
