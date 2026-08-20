import { ALDOSTERONE, DIURETICS, RENAL, THIRST } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import type { Diuretic } from './types';

/**
 * Aldosterone responds to two things directly: effective circulating volume (through renin and
 * angiotensin II) and serum potassium (sensed by the adrenal itself, with no renin involved).
 *
 * That dual control is why the same hormone can be pulled in opposite directions — a
 * hypovolaemic, hyperkalaemic patient gets a maximal signal from both, while volume expansion
 * with hyperkalaemia (as in advanced CKD) leaves the two fighting each other.
 */
export function aldosteroneTarget(ecfVolumeRatio: number, serumPotassiumMeqL: number, aldosteroneDrive: number): number {
  const volumeDrive = scaleClamped(
    ecfVolumeRatio,
    ALDOSTERONE.VOLUME_HIGH_RATIO,
    ALDOSTERONE.VOLUME_LOW_RATIO,
    ALDOSTERONE.VOLUME_MIN_DRIVE,
    ALDOSTERONE.VOLUME_MAX_DRIVE,
  );
  const potassiumDrive = scaleClamped(
    serumPotassiumMeqL,
    ALDOSTERONE.POTASSIUM_THRESHOLD,
    ALDOSTERONE.POTASSIUM_SATURATION,
    0,
    ALDOSTERONE.POTASSIUM_MAX_DRIVE,
  );
  return clamp(aldosteroneDrive * (volumeDrive + potassiumDrive), 0, ALDOSTERONE.MAX_LEVEL);
}

/**
 * Renal sodium excretion. Volume/pressure natriuresis is deliberately steep — this is the loop
 * that holds ECF volume within a few percent despite a tenfold range of dietary sodium, and it
 * is why a normal person cannot become oedematous simply by eating salt.
 */
export function sodiumExcretion(ecfVolumeRatio: number, aldosteroneLevel: number, diuretic: Diuretic): number {
  const volumeFactor = Math.max(0, ecfVolumeRatio) ** RENAL.VOLUME_NATRIURESIS_EXPONENT;
  const reabsorption = scaleClamped(
    aldosteroneLevel,
    0,
    2,
    RENAL.ALDOSTERONE_REABSORPTION_MIN,
    RENAL.ALDOSTERONE_REABSORPTION_MAX,
  );
  return (RENAL.SODIUM_BASE_MEQ_PER_DAY * volumeFactor * DIURETICS[diuretic].natriuresis) / reabsorption;
}

/** Thirst is the second limb of tonicity defence, and the only one that can correct a water
 * DEFICIT — the kidney can excrete water but cannot manufacture it. It is also why a patient
 * with diabetes insipidus who can drink stays nearly normonatraemic, and one who cannot does not. */
export function thirstTarget(effectiveOsmolality: number): number {
  return scaleClamped(effectiveOsmolality, THIRST.THRESHOLD_OSMOLALITY, THIRST.SATURATION_OSMOLALITY, 0, 1);
}
