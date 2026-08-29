import { clamp } from '@/shared/lib/math';
import type { InhibitorType } from './types';

/**
 * The inhibition factor α = 1 + [I]/Ki — how much the inhibitor multiplies whatever it
 * displaces. Competitive inhibitors inflate Km by α; pure noncompetitive deflate Vmax by the
 * same factor; uncompetitive (binding only the enzyme-substrate complex) scale BOTH down.
 */
export function alphaFactor(inhibitorType: InhibitorType, inhibitorUm: number, kiUm: number): number {
  if (inhibitorType === 'none') return 1;
  return 1 + clamp(inhibitorUm, 0, Infinity) / Math.max(kiUm, 0.05);
}

/** Apparent Km after inhibition, mmol/L. Raised ONLY by competitive inhibition. */
export function apparentKmMm(kmMm: number, inhibitorType: InhibitorType, inhibitorUm: number, kiUm: number): number {
  const a = alphaFactor(inhibitorType, inhibitorUm, kiUm);
  switch (inhibitorType) {
    case 'competitive':
      return kmMm * a;
    case 'uncompetitive':
      // Uncompetitive inhibitors bind only the ES complex, so substrate APPEARS stickier.
      return kmMm / a;
    default:
      return kmMm;
  }
}

/** Apparent Vmax after inhibition, µmol/min (before temperature/pH factors). */
export function apparentVmax(vmax: number, inhibitorType: InhibitorType, inhibitorUm: number, kiUm: number): number {
  const a = alphaFactor(inhibitorType, inhibitorUm, kiUm);
  if (inhibitorType === 'noncompetitive' || inhibitorType === 'uncompetitive') return vmax / a;
  return vmax;
}

/**
 * Michaelis-Menten velocity: v = Vmax·[S] / (Km + [S]).
 *
 * The most important curve in biochemistry. At [S] << Km velocity is near-linear in
 * substrate (first-order); at [S] >> Km it saturates at Vmax (zero-order) — which is why
 * giving more drug eventually stops helping, and why ethanol outcompetes methanol for ADH.
 */
export function rateAt(substrateMm: number, apparentVmaxUmMin: number, apparentKm: number): number {
  const s = clamp(substrateMm, 0, 1000);
  return (apparentVmaxUmMin * s) / (Math.max(apparentKm, 1e-6) + s);
}

/**
 * Temperature effect on enzyme activity.
 *
 * Below the optimum this is classic Q10 behaviour — roughly doubling per 10°C. Above ~42°C
 * denaturation begins and wins: the protein's shape IS its function, and heat destroys the
 * shape faster than kinetic energy accelerates it. Calibrated so 41°C still NET accelerates
 * (a fever speeds metabolism) while 47°C has fallen below baseline (heat illness).
 */
export function temperatureFactor(temperatureC: number): number {
  const q10 = Math.pow(2, (clamp(temperatureC, 5, 60) - 37) / 10);
  // Denaturation bites progressively above 42°C and is effectively total by ~50.
  const denatured = clamp(temperatureC > 42 ? 1 - (temperatureC - 42) / 8 : 1, 0, 1);
  return q10 * denatured;
}

/**
 * pH effect: a smooth optimum at physiological pH with steep falloff either side — charged
 * residues that bind substrate and stabilise the transition state only ionise correctly
 * within a narrow window. This is one reason systemic acidaemia is dangerous far beyond the
 * number on the blood gas.
 */
export function phFactor(ph: number): number {
  const offset = ph - 7.4;
  return Math.exp(-(offset * offset) / (2 * 0.65 * 0.65));
}
