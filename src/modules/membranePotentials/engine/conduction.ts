import { CONDUCTION, GATING, IONS } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Conduction velocity (m/s). Myelination is the dominant term — saltatory conduction between
 * nodes of Ranvier is what makes a myelinated fiber an order of magnitude faster than an
 * unmyelinated one of the same diameter. Sodium channel availability matters too, since each
 * node needs enough inward current to depolarize the next, and cooling slows everything via
 * the same Q10 that governs gating.
 *
 * Demyelination slows or blocks propagation without preventing the axon from generating an
 * action potential at all — the distinction between a conduction problem and an excitability one.
 */
export function conductionVelocity(myelination: number, gNaMaxDensity: number, temperatureC: number): number {
  const q10Factor = Math.pow(GATING.Q10, (temperatureC - IONS.REFERENCE_TEMP_C) / 10);
  const sodiumFactor = clamp(gNaMaxDensity, 0, 2);
  return (CONDUCTION.BASE_VELOCITY_M_PER_S + myelination * CONDUCTION.MYELINATION_GAIN) * Math.sqrt(sodiumFactor) * q10Factor;
}
