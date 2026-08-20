import { GATING, IONS } from './constants';

/** Logistic steady-state activation: 1/(1 + exp(-(V - Vhalf)/slope)). Rises with depolarization. */
function activationCurve(vm: number, halfMv: number, slopeMv: number): number {
  return 1 / (1 + Math.exp(-(vm - halfMv) / slopeMv));
}

/** Steady-state sodium ACTIVATION (m): opens fast on depolarization — the regenerative
 * upstroke of the action potential. */
export function mInfinity(vm: number): number {
  return activationCurve(vm, GATING.M_HALF_MV, GATING.M_SLOPE_MV);
}

/** Steady-state sodium INACTIVATION (h): the inverse — depolarization CLOSES it. Because h
 * closes more slowly than m opens, sodium current flows briefly and then shuts itself off.
 * A chronically depolarized cell (as in hyperkalemia) sits with h already low, which is why
 * it becomes harder to excite despite being closer to threshold. */
export function hInfinity(vm: number): number {
  return 1 - activationCurve(vm, GATING.H_HALF_MV, GATING.H_SLOPE_MV);
}

/** Steady-state potassium activation (n): the delayed rectifier — opens slowest, driving
 * repolarization and the afterhyperpolarization. */
export function nInfinity(vm: number): number {
  return activationCurve(vm, GATING.N_HALF_MV, GATING.N_SLOPE_MV);
}

/**
 * Q10 temperature scaling for gating time constants: every 10°C rise multiplies rate by Q10
 * (so divides tau by Q10). Cooling slows every gate, prolonging the action potential and
 * slowing conduction.
 */
export function temperatureScaledTau(baseTauSeconds: number, temperatureC: number): number {
  const rateFactor = Math.pow(GATING.Q10, (temperatureC - IONS.REFERENCE_TEMP_C) / 10);
  return baseTauSeconds / rateFactor;
}
