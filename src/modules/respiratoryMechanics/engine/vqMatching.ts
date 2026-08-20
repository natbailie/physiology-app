import { VQ } from './constants';
import { clamp } from '@/shared/lib/math';

export interface VQCompartments {
  ventilationUnitA: number;
  ventilationUnitB: number;
  perfusionUnitA: number;
  perfusionUnitB: number;
  vqRatioA: number;
  vqRatioB: number;
}

/** Target hypoxic pulmonary vasoconstriction diversion (0..1). HPV senses low ALVEOLAR
 * oxygen and constricts the local pulmonary arterioles, redirecting blood toward better
 * ventilated lung. It therefore responds to shunt (unventilated but perfused) units. */
export function hpvDiversionTarget(shuntFraction: number, hpvStrength: number): number {
  const shunt = clamp(shuntFraction / 100, 0, 1);
  return clamp(shunt * clamp(hpvStrength, 0, 1.5) * VQ.MAX_HPV_DIVERSION, 0, 1);
}

/**
 * A two-compartment lung. Unit A is healthy; unit B carries whatever dead space or shunt has
 * been dialed in.
 *
 * The distinction is the point of the whole model:
 * - DEAD SPACE is ventilated but not perfused (V/Q → infinity), as in pulmonary embolism.
 * - SHUNT is perfused but not ventilated (V/Q → 0), as in pneumonia or atelectasis.
 *
 * And HPV can only help ONE of them. It diverts blood away from poorly ventilated lung, which
 * is exactly the shunt problem — so it partially compensates there. Against dead space it is
 * useless: the blood has already left that unit, and there is no perfusion to redirect. That
 * asymmetry is why shunt and dead space behave so differently despite both being "V/Q mismatch".
 */
export function vqCompartments(deadSpaceFraction: number, shuntFraction: number, hpvDiversion: number): VQCompartments {
  const deadSpace = clamp(deadSpaceFraction / 100, 0, 1);
  const shunt = clamp(shuntFraction / 100, 0, 1);

  // Unit B is the abnormal compartment: dead space removes its perfusion, shunt removes its
  // ventilation. The severity is doubled so that the dialed-in fraction refers to the whole
  // lung while unit B (roughly half of it) bears the entire defect — otherwise a "35% shunt"
  // would leave unit B still well ventilated and would not read as a shunt at all.
  const ventilationUnitB = clamp(VQ.BASELINE_VENTILATION * (1 - shunt * 2), 0, 1);
  const perfusionBeforeHpv = clamp(VQ.BASELINE_PERFUSION * (1 - deadSpace * 2), 0, 1);
  // HPV redirects perfusion out of unit B and into unit A.
  const perfusionUnitB = clamp(perfusionBeforeHpv * (1 - hpvDiversion), 0, 1);
  const divertedPerfusion = perfusionBeforeHpv - perfusionUnitB;

  const ventilationUnitA = VQ.BASELINE_VENTILATION;
  const perfusionUnitA = VQ.BASELINE_PERFUSION + divertedPerfusion;

  return {
    ventilationUnitA,
    ventilationUnitB,
    perfusionUnitA,
    perfusionUnitB,
    vqRatioA: clamp(ventilationUnitA / Math.max(perfusionUnitA, VQ.MIN_PERFUSION), 0, VQ.MAX_VQ_RATIO),
    vqRatioB: clamp(ventilationUnitB / Math.max(perfusionUnitB, VQ.MIN_PERFUSION), 0, VQ.MAX_VQ_RATIO),
  };
}
