import { COLLATERAL, EVENTS, STENOSIS, SUPPLY } from './constants';
import { clamp } from '@/shared/lib/math';

/** Effective narrowing of the epicardial segment: fixed plaque, plus diffuse constrictor tone,
 * plus a focal spasm event. Nitrates relieve the dynamic components before this is formed
 * (see drugs.ts), so what arrives here is already post-pharmacology. */
export function effectiveSeverity(stenosisFraction: number, toneFraction: number, spasmBurst: number): number {
  return clamp(
    stenosisFraction + toneFraction + EVENTS.SPASM_BURST_SEVERITY * spasmBurst,
    0,
    STENOSIS.SEVERITY_CAP,
  );
}

/** Lesion resistance coefficient. Energy loss in a stenotic segment grows roughly with the
 * square of flow and catastrophically with narrowing — (d/(1−d))^EXP captures why 60% is a
 * curiosity at catheterisation while 90% is an admission. */
export function severityCoefficient(effectiveSeverityFraction: number): number {
  const residual = Math.max(1 - effectiveSeverityFraction, 1 - STENOSIS.SEVERITY_CAP);
  return STENOSIS.B_COEF * Math.pow(effectiveSeverityFraction / residual, STENOSIS.SEVERITY_EXP);
}

/** Collateral flow delivered around the lesion, in normal-rest-flow units. A parallel path that
 * grows over months — which is why a chronically occluded vessel can rest quietly and an acutely
 * occluded one cannot. */
export function collateralFlow(collateralFraction: number, effectiveDrivingPressureMmHg: number): number {
  return (
    COLLATERAL.CAPACITY *
    clamp(collateralFraction, 0, 1) *
    (effectiveDrivingPressureMmHg / SUPPLY.EFFECTIVE_DRIVING_REF_MMHG)
  );
}

/**
 * Maximal flow through the lesion into a fully dilated microvasculature.
 *
 * The driving pressure splits between the lesion's quadratic loss (b·Q² + a·Q) and the
 * microvascular bed's linear one (Q / conductance). Solving the resulting quadratic gives the
 * hyperaemic flow limit — the number coronary flow reserve has been measuring since Gould.
 */
export function maximalLesionFlow(
  effectiveDrivingPressureMmHg: number,
  maximalConductance: number,
  severityCoefficientValue: number,
): number {
  if (severityCoefficientValue < 1e-6) return effectiveDrivingPressureMmHg * maximalConductance;
  const linearCoefficient = STENOSIS.A_COEF + 1 / Math.max(maximalConductance, 1e-6);
  const b = severityCoefficientValue;
  const discriminant =
    linearCoefficient * linearCoefficient + 4 * b * Math.max(effectiveDrivingPressureMmHg, 0);
  if (discriminant <= 0) return 0;
  return (-linearCoefficient + Math.sqrt(discriminant)) / (2 * b);
}
