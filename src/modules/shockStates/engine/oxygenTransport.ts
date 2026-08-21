import { LACTATE, OXYGEN } from './constants';
import { clamp } from '@/shared/lib/math';

/** Oxygen delivery, mL/min: DO2 = Hb x 1.34 x SaO2 x CO x 10. Note it is a PRODUCT — anaemia,
 * desaturation and low output each cut it independently, and correcting only one may not be
 * enough. */
export function oxygenDelivery(haemoglobinGDl: number, cardiacOutputLPerMin: number): number {
  return OXYGEN.ML_PER_G_HB * haemoglobinGDl * OXYGEN.ARTERIAL_SATURATION * cardiacOutputLPerMin * 10;
}

/**
 * Oxygen actually consumed, mL/min.
 *
 * Normally consumption is set by demand and is independent of delivery — tissue simply extracts
 * more when less arrives. Below a critical delivery, or when extraction itself is impaired,
 * consumption becomes delivery-dependent and the tissue goes into debt. That transition is what
 * shock IS, and it is why shock is defined by perfusion rather than by blood pressure.
 */
export function oxygenConsumption(
  demandMlPerMin: number,
  deliveryMlPerMin: number,
  extractionCapacity: number,
): number {
  const ceiling = deliveryMlPerMin * OXYGEN.MAX_EXTRACTION_FRACTION * clamp(extractionCapacity, 0, 1.3);
  return Math.min(demandMlPerMin, ceiling);
}

/**
 * Mixed venous saturation, %.
 *
 * SvO2 is what is left over after the tissues have taken what they can. It falls when delivery
 * is inadequate — and rises when tissue CANNOT extract, which is why a septic patient can show
 * a high SvO2 while producing lactate. A high SvO2 is reassuring only if the lactate is normal.
 */
export function mixedVenousSaturation(
  consumptionMlPerMin: number,
  haemoglobinGDl: number,
  cardiacOutputLPerMin: number,
): number {
  const carrying = OXYGEN.ML_PER_G_HB * haemoglobinGDl * cardiacOutputLPerMin * 10;
  if (carrying <= 0) return 0;
  return clamp((OXYGEN.ARTERIAL_SATURATION - consumptionMlPerMin / carrying) * 100, 0, 100);
}

export function extractionRatio(consumptionMlPerMin: number, deliveryMlPerMin: number): number {
  if (deliveryMlPerMin <= 0) return 0;
  return clamp(consumptionMlPerMin / deliveryMlPerMin, 0, 1);
}

/** Lactate accumulates in proportion to unmet demand and clears slowly, so it reports the
 * INTEGRAL of the debt rather than the instantaneous state. */
export function lactateTarget(demandMlPerMin: number, consumptionMlPerMin: number): number {
  const debt = Math.max(0, demandMlPerMin - consumptionMlPerMin);
  return clamp(LACTATE.BASELINE_MMOL_L + debt * LACTATE.PRODUCTION_GAIN * 60, LACTATE.BASELINE_MMOL_L, LACTATE.MAX_MMOL_L);
}
