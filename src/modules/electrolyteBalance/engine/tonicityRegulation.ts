import { ADH, DIURETICS } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import type { AdhMode, Diuretic } from './types';

/**
 * ADH secretion. Two independent stimuli compete, and which one wins explains most of the
 * confusion around hyponatraemia.
 *
 * The osmotic stimulus is exquisitely sensitive — a 1% rise in tonicity changes ADH measurably —
 * and it is the one that should switch ADH OFF when serum sodium falls. The non-osmotic
 * (baroreceptor) stimulus is insensitive until volume falls by about 10%, but once engaged it
 * overrides osmolality completely. A hypovolaemic patient therefore keeps retaining water while
 * their sodium falls: the body defends circulating volume ahead of tonicity, and the
 * hyponatraemia is the price. That is a correct decision by the kidney, not a malfunction.
 */
export function adhTarget(effectiveOsmolality: number, ecfVolumeRatio: number, adhMode: AdhMode): number {
  if (adhMode === 'deficient') return 0;

  const osmoticDrive = scaleClamped(effectiveOsmolality, ADH.OSMOTIC_THRESHOLD, ADH.OSMOTIC_SATURATION, 0, 1);
  const volumeDrive = scaleClamped(ecfVolumeRatio, ADH.VOLUME_THRESHOLD_RATIO, ADH.VOLUME_SATURATION_RATIO, 0, ADH.VOLUME_MAX_DRIVE);
  const regulated = clamp(osmoticDrive + volumeDrive, 0, 1);

  // SIADH: secretion is fixed high and no longer answers to osmolality at all.
  return adhMode === 'inappropriate' ? Math.max(regulated, ADH.INAPPROPRIATE_FLOOR) : regulated;
}

/** How concentrated the urine ends up, given ADH and whatever the diuretic will allow. */
export function urineOsmolality(adhLevel: number, diuretic: Diuretic): number {
  const profile = DIURETICS[diuretic];
  const target = scaleClamped(adhLevel, 0, 1, ADH.MIN_URINE_OSMOLALITY, ADH.MAX_URINE_OSMOLALITY);
  return clamp(target, profile.minUrineOsmolality, profile.maxUrineOsmolality);
}

/**
 * Urine volume is not chosen by the kidney — it is forced by the solute that must be excreted
 * divided by the concentration the kidney can achieve. Hold the solute load constant and urine
 * output is entirely a function of urine osmolality.
 */
export function urineVolume(osmolarLoadMOsmPerDay: number, urineOsm: number): number {
  return osmolarLoadMOsmPerDay / Math.max(urineOsm, 20);
}

export function osmolarLoad(sodiumExcretionMeqPerDay: number, potassiumExcretionMeqPerDay: number): number {
  return 2 * sodiumExcretionMeqPerDay + 2 * potassiumExcretionMeqPerDay + ADH.UREA_LOAD_MOSM_PER_DAY;
}

/**
 * Free water clearance: the volume of solute-free water the kidney is adding to or removing
 * from the body each day. Negative means water is being retained faster than solute — the
 * defining abnormality in SIADH, and the reason those patients become hyponatraemic on a normal
 * fluid intake.
 */
export function freeWaterClearance(urineVolumeLPerDay: number, urineOsm: number, serumOsm: number): number {
  return urineVolumeLPerDay * (1 - urineOsm / Math.max(serumOsm, 1));
}
