import { CIRCULATION, THORACIC } from './constants';

/**
 * Mean systemic filling pressure: the pressure that would be found everywhere in the
 * circulation if the heart stopped and all pressures equalised. About 7 mmHg.
 *
 * It is the upstream pressure driving every drop of venous return, and it is set entirely by
 * the VESSELS — by how much blood is stretching them and how compliant they are. The heart
 * contributes nothing to it. That is the whole reason cardiac output is not something the heart
 * decides on its own.
 */
export function meanSystemicFillingPressure(
  stressedVolumeMl: number,
  totalComplianceMlPerMmHg: number,
  intrathoracicPressureMmHg: number = THORACIC.NORMAL_PRESSURE_MMHG,
): number {
  const elastic = stressedVolumeMl / Math.max(totalComplianceMlPerMmHg, 1);
  // Pressure applied to the chest is transmitted onward to the abdominal veins, so raising it
  // shifts the venous return curve to the right as well as the cardiac curve. Both curves move
  // together, which is why positive-pressure ventilation reduces cardiac output rather than
  // abolishing it.
  return elastic + THORACIC.PMSF_TRANSMISSION * (intrathoracicPressureMmHg - THORACIC.NORMAL_PRESSURE_MMHG);
}

/**
 * Only stressed volume generates pressure. The rest — about 86% of the total — simply fills the
 * vessels without stretching them.
 *
 * This distinction is what venoconstriction acts on. Sympathetic activity contracts venous
 * smooth muscle, converting unstressed volume into stressed volume, and the filling pressure
 * rises with no change whatsoever in blood volume. It is how the body raises cardiac output in
 * seconds, long before any fluid could be given, and it is why a patient can be "volume
 * responsive" without being volume depleted.
 */
export function stressedVolume(totalBloodVolumeMl: number, unstressedVolumeFraction: number): number {
  return Math.max(0, totalBloodVolumeMl * (1 - unstressedVolumeFraction));
}

export function totalCompliance(venousCompliance: number): number {
  return CIRCULATION.TOTAL_COMPLIANCE_ML_PER_MMHG * Math.max(venousCompliance, 0.05);
}
