import { CHEMORECEPTOR, GAS_EXCHANGE } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Central (medullary) chemoreceptor component of ventilatory drive: responds to rising
 * PaCO2 and falling pH. Capped at CENTRAL_MAX_DRIVE rather than at the full range — see
 * that constant for why the top of the range is reserved for the hypoxic component.
 */
export function centralDriveTarget(currentPaCO2: number, currentPH: number): number {
  const co2Term = (currentPaCO2 - GAS_EXCHANGE.BASELINE_PACO2_MMHG) / CHEMORECEPTOR.CO2_SENSITIVITY_MMHG;
  const phTerm = (7.4 - currentPH) / CHEMORECEPTOR.PH_SENSITIVITY;
  return clamp(co2Term + phTerm, -1, CHEMORECEPTOR.CENTRAL_MAX_DRIVE);
}

/**
 * Peripheral (carotid/aortic body) chemoreceptor component: silent until PaO2 falls below
 * the hypoxic threshold, then recruits steeply. Never negative — hyperoxia does not push
 * ventilation below the central set point, it only withdraws this contribution.
 */
export function hypoxicDriveTarget(currentPaO2: number): number {
  return clamp(
    Math.max(0, CHEMORECEPTOR.HYPOXIC_THRESHOLD_MMHG - currentPaO2) / CHEMORECEPTOR.HYPOXIC_SENSITIVITY_MMHG,
    0,
    1,
  );
}

/**
 * Target chemoreceptor drive (-1..1) — the sum of the two components above.
 *
 * The components are clamped SEPARATELY before being summed, and that is the whole point:
 * clamping only the sum meant any patient hypoventilating enough to be hypoxaemic already
 * had drive pinned at 1 from CO2/pH alone, so removing the hypoxaemia (supplemental O2)
 * changed ventilation not at all. Reserving the top of the range for the hypoxic component
 * makes the withdrawal of hypoxic drive a real loss of ventilation, which is what produces
 * oxygen-induced hypercapnia in a chronic CO2 retainer.
 *
 * The engine relaxes the actual (smoothed) drive toward this target on
 * CHEMORECEPTOR.TAU_SECONDS — the fastest actuator in this module, mirroring how
 * baroreflexDrive is the fastest in the cardiorenal module.
 */
export function chemoreceptorDriveTarget(currentPaCO2: number, currentPaO2: number, currentPH: number): number {
  return clamp(centralDriveTarget(currentPaCO2, currentPH) + hypoxicDriveTarget(currentPaO2), -1, 1);
}
