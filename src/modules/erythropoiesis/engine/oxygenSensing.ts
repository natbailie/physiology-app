import { EPO, OXYGEN_DELIVERY } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/** Oxygen delivery to the tissues, mL/min: DO2 = Hb × 1.34 × SaO2 × cardiac output. */
export function oxygenDeliveryMlPerMin(hemoglobinGDl: number, inspiredOxygen: number): number {
  const saturation = clamp((inspiredOxygen / 100) * OXYGEN_DELIVERY.NORMAL_SAO2, 0, 1);
  return hemoglobinGDl * OXYGEN_DELIVERY.O2_CARRYING_CAPACITY_ML_PER_G * saturation * OXYGEN_DELIVERY.CARDIAC_OUTPUT_DL_PER_MIN;
}

/** How hypoxic the renal oxygen sensor is, 0..1. */
export function tissueHypoxia(hemoglobinGDl: number, inspiredOxygen: number): number {
  // Reduced inspired oxygen is sensed as hypoxia even at a perfectly normal haemoglobin —
  // which is why altitude drives erythropoiesis in someone who is not anemic at all.
  const effectiveHb = hemoglobinGDl * clamp(inspiredOxygen / 100, 0, 1.2);
  return scaleClamped(effectiveHb, EPO.HYPOXIA_SATURATION_G_DL, EPO.HYPOXIA_THRESHOLD_G_DL, 1, 0);
}

/**
 * Target EPO level, 0..1.
 *
 * Peritubular interstitial cells in the kidney stabilise HIF when oxygen is low and transcribe
 * erythropoietin. Two things follow, and both are clinically important. First, the response is
 * steep — EPO rises many-fold for a modest fall in haemoglobin. Second, because the sensor and
 * the hormone are both renal, chronic kidney disease produces anemia through hormone
 * DEFICIENCY while the marrow itself is perfectly capable — which is exactly why recombinant
 * EPO treats it and iron alone does not.
 */
export function epoTarget(hemoglobinGDl: number, inspiredOxygen: number, renalFunction: number): number {
  const hypoxia = tissueHypoxia(hemoglobinGDl, inspiredOxygen);
  return clamp(hypoxia * clamp(renalFunction, 0, 1.5), 0, 1);
}
