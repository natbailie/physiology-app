import { INTRINSIC } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Circulating factor VIII activity, 0..1.
 *
 * von Willebrand factor is factor VIII's carrier protein — unbound VIII is cleared within
 * minutes. So a vWF deficiency drags factor VIII down with it, which is why von Willebrand
 * disease produces a mildly prolonged APTT on top of its platelet-type bleeding, and why it
 * can be mistaken for mild hemophilia A on a screening panel.
 */
export function effectiveFactorVIII(factorVIIIActivity: number, vonWillebrandFactor: number): number {
  const intrinsic = factorVIIIActivity / 100;
  const carrierLimited = (vonWillebrandFactor / 100) * INTRINSIC.VWF_CARRIES_VIII_FRACTION + (1 - INTRINSIC.VWF_CARRIES_VIII_FRACTION);
  return clamp(intrinsic * clamp(carrierLimited, 0, 1), 0, 1.5);
}

/** Effective factor IX activity, 0..1 — vitamin K-dependent as well as intrinsically variable,
 * so it falls both in hemophilia B and on warfarin. */
export function effectiveFactorIX(factorIXActivity: number, vitaminKDependentFactors: number): number {
  return clamp((factorIXActivity / 100) * (vitaminKDependentFactors / 100) * INTRINSIC.IX_SENSITIVITY, 0, 1.5);
}

/**
 * Rate at which the intrinsic pathway generates factor Xa. The tenase complex needs BOTH
 * factor VIIIa and factor IXa, so losing either one alone cripples the limb — hemophilia A and
 * hemophilia B are clinically near-indistinguishable for exactly this reason, and both show a
 * long APTT with a normal PT.
 */
export function intrinsicXaGeneration(
  factorVIIIActivity: number,
  factorIXActivity: number,
  vonWillebrandFactor: number,
  vitaminKDependentFactors: number,
  plateletSurface: number,
): number {
  const viii = effectiveFactorVIII(factorVIIIActivity, vonWillebrandFactor);
  const ix = effectiveFactorIX(factorIXActivity, vitaminKDependentFactors);
  // A multiplicative pairing: the complex only works when both partners are present.
  return clamp(viii * ix * plateletSurface * INTRINSIC.CONTACT_ACTIVATION_GAIN, 0, 2);
}
