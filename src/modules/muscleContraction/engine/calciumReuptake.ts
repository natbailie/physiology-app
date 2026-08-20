import { CALCIUM, MUSCLE_TYPES } from './constants';
import type { MuscleType } from './types';

/**
 * SERCA pumping, µM/s — Michaelis-Menten in cytosolic calcium and strictly ATP-dependent.
 *
 * Relaxation is an active, energy-consuming process, not the passive absence of contraction.
 * Everything that slows this pump (low ATP, low SERCA expression, ischaemia) slows relaxation,
 * and if it stops entirely the standing SR leak wins and cytosolic calcium climbs.
 */
export function uptakeFlux(
  cytosolicCalciumUM: number,
  sercaActivity: number,
  atpAvailability: number,
  muscleType: MuscleType,
): number {
  const vmax =
    CALCIUM.SERCA_VMAX_UM_PER_S * MUSCLE_TYPES[muscleType].sercaScale * Math.max(0, sercaActivity) * Math.max(0, atpAvailability);
  const saturation = cytosolicCalciumUM / (CALCIUM.SERCA_KM_UM + cytosolicCalciumUM);
  return vmax * saturation;
}

/** Time for calcium to be cleared and tension to fall away once stimulation stops, ms. */
export function relaxationTimeMs(sercaActivity: number, atpAvailability: number, muscleType: MuscleType): number {
  const capacity = Math.max(0.01, sercaActivity * atpAvailability * MUSCLE_TYPES[muscleType].sercaScale);
  return CALCIUM.BASE_RELAXATION_MS / capacity;
}
