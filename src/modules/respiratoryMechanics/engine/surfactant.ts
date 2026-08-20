import { MECHANICS } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Effective lung compliance after the surfactant penalty, mL/cmH2O.
 *
 * Surfactant lowers alveolar surface tension. Laplace's law (P = 2T/r) says that for a given
 * surface tension, SMALLER alveoli generate higher collapsing pressure — so without
 * surfactant small alveoli would empty into large ones and collapse. Surfactant's real trick
 * is that its tension-lowering effect is strongest at small radii, which stabilizes alveoli
 * of different sizes against each other.
 *
 * This model captures only the net consequence — that losing surfactant makes the lung much
 * stiffer — as a multiplicative penalty on compliance, rather than modeling the radius-
 * dependent tension itself. That is why neonatal respiratory distress syndrome appears here
 * as a compliance problem distinct from intrinsic tissue stiffness.
 */
export function effectiveCompliance(lungCompliance: number, surfactantFunction: number): number {
  const factor = scaleClamped(surfactantFunction, 0, 1, MECHANICS.SURFACTANT_MIN_COMPLIANCE_FACTOR, 1);
  return clamp(lungCompliance * factor, 5, 200);
}
