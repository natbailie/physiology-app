import { IONS } from './constants';

/**
 * Nernst equilibrium potential for a monovalent cation, mV:
 *   E = (RT/zF)·ln([out]/[in]) ≈ 61.5·log10([out]/[in]) at 37°C
 * The slope scales with absolute temperature, so the same concentration gradient produces a
 * slightly smaller driving force when the tissue is cooled.
 */
export function nernstPotential(concentrationOut: number, concentrationIn: number, temperatureC: number): number {
  const slope = IONS.NERNST_SLOPE_37C_MV * ((temperatureC + IONS.KELVIN_OFFSET) / (IONS.REFERENCE_TEMP_C + IONS.KELVIN_OFFSET));
  return slope * Math.log10(concentrationOut / concentrationIn);
}

/** Potassium equilibrium potential — normally about -95 mV, and the main determinant of the
 * resting potential. Raising extracellular K+ moves E_K toward zero, which is exactly why
 * hyperkalemia depolarizes the resting membrane. */
export function eK(extracellularK: number, temperatureC: number): number {
  return nernstPotential(extracellularK, IONS.INTRACELLULAR_K_MEQ_L, temperatureC);
}

/** Sodium equilibrium potential — normally about +60 mV, setting the ceiling the action
 * potential overshoots toward. */
export function eNa(extracellularNa: number, temperatureC: number): number {
  return nernstPotential(extracellularNa, IONS.INTRACELLULAR_NA_MEQ_L, temperatureC);
}
