import { CHEMORECEPTOR, GAS_EXCHANGE } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target chemoreceptor drive (-1..1): central chemoreceptors respond to rising PaCO2
 * and falling pH, peripheral chemoreceptors additionally recruit once PaO2 falls
 * below the hypoxic threshold. The engine relaxes the actual (smoothed) drive toward
 * this target on CHEMORECEPTOR.TAU_SECONDS — the fastest actuator in this module,
 * mirroring how baroreflexDrive is the fastest in the cardiorenal module.
 */
export function chemoreceptorDriveTarget(currentPaCO2: number, currentPaO2: number, currentPH: number): number {
  const co2Term = (currentPaCO2 - GAS_EXCHANGE.BASELINE_PACO2_MMHG) / CHEMORECEPTOR.CO2_SENSITIVITY_MMHG;
  const hypoxicTerm =
    Math.max(0, CHEMORECEPTOR.HYPOXIC_THRESHOLD_MMHG - currentPaO2) / CHEMORECEPTOR.HYPOXIC_SENSITIVITY_MMHG;
  const phTerm = (7.4 - currentPH) / CHEMORECEPTOR.PH_SENSITIVITY;
  return clamp(co2Term + hypoxicTerm + phTerm, -1, 1);
}
