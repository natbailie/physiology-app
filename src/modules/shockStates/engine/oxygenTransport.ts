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

/**
 * Lactate accumulates in proportion to unmet demand and clears slowly, so it reports the INTEGRAL
 * of the debt rather than the instantaneous state.
 *
 * TWO sources, and the second is what makes lactate an early sign rather than a late one. Global
 * debt is a threshold — tissue simply extracts more until it cannot, and only then goes into debt.
 * Regional production starts sooner: the vasoconstriction defending arterial pressure is itself
 * shutting beds down, and they go anaerobic while the global numbers still balance. See
 * `LACTATE.REGIONAL_THRESHOLD_DRIVE`.
 *
 * A bed starves for either of two reasons, so the regional term takes the WORSE of them: the
 * reflex has diverted its flow away, or there is not enough flow to divert. Keying it to reflex
 * drive alone left the `decompensating` preset — a patient at MAP 38 with the reflex removed —
 * reporting a normal lactate, which is the one thing that state cannot have.
 */
export function lactateTarget(
  demandMlPerMin: number,
  consumptionMlPerMin: number,
  sympatheticDrive = 0,
  cardiacOutputFraction = 1,
): number {
  const debt = Math.max(0, demandMlPerMin - consumptionMlPerMin);
  const starved = Math.max(clamp(sympatheticDrive, 0, 1), clamp(1 - cardiacOutputFraction, 0, 1));
  const constricted = Math.max(0, starved - LACTATE.REGIONAL_THRESHOLD_DRIVE);
  const regional = (constricted / (1 - LACTATE.REGIONAL_THRESHOLD_DRIVE)) * LACTATE.REGIONAL_GAIN_MMOL_L;
  return clamp(
    LACTATE.BASELINE_MMOL_L + debt * LACTATE.PRODUCTION_GAIN * 60 + regional,
    LACTATE.BASELINE_MMOL_L,
    LACTATE.MAX_MMOL_L,
  );
}
