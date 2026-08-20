import { THORACIC } from './constants';

/**
 * Intrathoracic pressure surrounding the heart, including any transient surge from a Valsalva
 * manoeuvre.
 *
 * The heart is a pump inside a pressure chamber. What distends it is the transmural pressure —
 * inside minus outside — so raising the pressure around it shifts the entire cardiac function
 * curve to the right: the same measured right atrial pressure now produces less filling and less
 * output. This is why positive-pressure ventilation and PEEP reduce cardiac output in a
 * volume-depleted patient, and why the arterial pressure falls during the strain of a Valsalva.
 *
 * Negative intrathoracic pressure does the reverse, which is why spontaneous inspiration
 * augments venous return.
 */
export function effectiveIntrathoracicPressure(intrathoracicPressure: number, surgeMmHg: number): number {
  return intrathoracicPressure + surgeMmHg;
}

export const VALSALVA_SURGE_MMHG = THORACIC.VALSALVA_SURGE_MMHG;
