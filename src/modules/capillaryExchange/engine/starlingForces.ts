import { CIRCULATION, STARLING, TISSUE_BEDS } from './constants';
import { clamp } from '@/shared/lib/math';
import type { TissueBed } from './types';

/**
 * Mean capillary hydrostatic pressure from the pressures on either side of it.
 *
 * Pc = (Pa/Ra + Pv/Rv) / (1/Ra + 1/Rv). The consequence worth internalising is what the
 * resistance ratio does: because precapillary resistance normally exceeds postcapillary
 * resistance about fifteenfold, a rise in VENOUS pressure is transmitted almost completely to
 * the capillary, while a rise in ARTERIAL pressure is largely absorbed by the arteriole. That
 * asymmetry is why heart failure and venous obstruction cause oedema and hypertension does not.
 */
export function capillaryPressure(
  arterialInflowPressure: number,
  venousOutflowPressure: number,
  precapillaryTone: number,
  tissueBed: TissueBed,
  plasmaVolumeMl: number,
  baselinePlasmaVolumeMl: number,
): number {
  const preToPost = TISSUE_BEDS[tissueBed].preToPostResistanceRatio * Math.max(precapillaryTone, 0.05);
  const perfusion = perfusionFactor(plasmaVolumeMl, baselinePlasmaVolumeMl);
  return ((arterialInflowPressure + venousOutflowPressure * preToPost) / (1 + preToPost)) * perfusion;
}

/**
 * Losing plasma into the tissues lowers the pressures feeding the capillary, which lowers
 * capillary pressure, which slows further filtration. It is the brake that stops any leak
 * running away — and the reason a patient with severe capillary leak is hypotensive rather than
 * simply swollen. The oedema is limited by the circulation emptying.
 */
export function perfusionFactor(plasmaVolumeMl: number, baselinePlasmaVolumeMl: number): number {
  const ratio = plasmaVolumeMl / Math.max(baselinePlasmaVolumeMl, 1);
  return clamp(ratio, CIRCULATION.MIN_PERFUSION_RATIO, CIRCULATION.MAX_PERFUSION_RATIO) ** CIRCULATION.PERFUSION_EXPONENT;
}

/** Pressure falls along the capillary, so the arteriolar end filters and the venular end may
 * reabsorb. The classical picture of filtration reversing partway along is exactly this. */
export function endPressures(
  meanCapillaryPressure: number,
  arterialInflowPressure: number,
  venousOutflowPressure: number,
  tissueBed: TissueBed,
): { arteriolar: number; venular: number } {
  const spread =
    (arterialInflowPressure - venousOutflowPressure) * TISSUE_BEDS[tissueBed].endPressureSpreadFraction;
  return {
    arteriolar: meanCapillaryPressure + spread / 2,
    venular: meanCapillaryPressure - spread / 2,
  };
}

/**
 * The Starling equation: Jv = Kf · [(Pc − Pi) − σ(πc − πi)].
 *
 * Four forces, two pushing fluid out (capillary hydrostatic, interstitial oncotic) and two
 * holding it in (interstitial hydrostatic, plasma oncotic). Every cause of oedema is a change
 * in one of them, or in one of the two coefficients — and the reflection coefficient σ is the
 * one most easily forgotten, because it does not appear as a pressure at all. When σ falls,
 * protein crosses freely and the entire oncotic term stops working, which is why albumin
 * infusion helps a nephrotic patient and fails a septic one.
 */
export function netFiltrationPressure(
  capillaryPressureMmHg: number,
  interstitialPressureMmHg: number,
  plasmaOncoticMmHg: number,
  interstitialOncoticMmHg: number,
  reflectionCoefficient: number,
): number {
  const hydrostatic = capillaryPressureMmHg - interstitialPressureMmHg;
  const oncotic = reflectionCoefficient * (plasmaOncoticMmHg - interstitialOncoticMmHg);
  return hydrostatic - oncotic;
}

export function filtrationRate(netPressureMmHg: number, capillaryPermeability: number, tissueBed: TissueBed): number {
  const kf = STARLING.KF_BASE_ML_PER_MIN_PER_MMHG * capillaryPermeability * TISSUE_BEDS[tissueBed].kfScale;
  return kf * netPressureMmHg;
}
