import { BASELINE, DIURETICS, INTAKE, RENAL } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import type { Diuretic } from './types';

/**
 * Renal potassium excretion is almost entirely distal SECRETION, not filtration — which is why
 * it is set by three factors multiplied together: aldosterone, distal flow, and the serum level
 * driving the gradient. Knock out any one of the three and excretion collapses, and that single
 * structure accounts for nearly every potassium disorder in clinical medicine.
 *
 * Aldosterone missing (Addison's, spironolactone, ACE inhibitors) → hyperkalaemia. Distal flow
 * missing (oliguric renal failure, severe volume depletion) → hyperkalaemia. Flow excessive
 * (loop and thiazide diuretics) → hypokalaemia. GFR is the fourth term, which is why potassium
 * usually stays normal in CKD until the GFR is severely reduced: the remaining nephrons simply
 * secrete more per nephron until they cannot.
 */
export function potassiumExcretion(
  serumPotassiumMeqL: number,
  aldosteroneLevel: number,
  urineVolumeLPerDay: number,
  gfrFraction: number,
  arterialPH: number,
  diuretic: Diuretic,
): number {
  const serumFactor = (Math.max(0, serumPotassiumMeqL) / BASELINE.SERUM_POTASSIUM_MEQ_L) ** RENAL.POTASSIUM_SERUM_EXPONENT;
  const aldosteroneFactor = scaleClamped(aldosteroneLevel, 0, 2, RENAL.POTASSIUM_ALDOSTERONE_MIN, RENAL.POTASSIUM_ALDOSTERONE_MAX);
  const flowFactor = clamp(
    (Math.max(0, urineVolumeLPerDay) / RENAL.BASELINE_URINE_L_PER_DAY) ** RENAL.POTASSIUM_FLOW_EXPONENT,
    RENAL.POTASSIUM_FLOW_MIN_FACTOR,
    RENAL.POTASSIUM_FLOW_MAX_FACTOR,
  );
  const gfrFactor = scaleClamped(gfrFraction, 0.05, 1, RENAL.POTASSIUM_GFR_MIN_FACTOR, 1);
  // Alkalosis promotes secretion (hydrogen ions are scarce, so potassium is secreted instead);
  // acidosis suppresses it. This is why vomiting causes so much RENAL potassium loss.
  const phFactor = scaleClamped(
    arterialPH,
    RENAL.POTASSIUM_PH_LOW,
    RENAL.POTASSIUM_PH_HIGH,
    RENAL.POTASSIUM_PH_MIN_FACTOR,
    RENAL.POTASSIUM_PH_MAX_FACTOR,
  );

  const renal =
    RENAL.POTASSIUM_BASE_MEQ_PER_DAY *
    serumFactor *
    aldosteroneFactor *
    flowFactor *
    gfrFactor *
    phFactor *
    DIURETICS[diuretic].potassiumWasting;

  return renal + colonicExcretion(gfrFraction);
}

/** Colonic potassium secretion, mEq/day. It rises several-fold as the GFR falls — the body's
 * back-up route once the kidney can no longer do the job. */
export function colonicExcretion(gfrFraction: number): number {
  const adaptation = scaleClamped(gfrFraction, 1, 0.1, 1, INTAKE.MAX_COLONIC_ADAPTATION);
  return INTAKE.STOOL_POTASSIUM_MEQ_PER_DAY * adaptation;
}

/**
 * The transtubular potassium gradient asks whether the kidney is behaving appropriately. A
 * hyperkalaemic patient should have a high TTKG (the kidney is trying to excrete); a low one
 * says the kidney is the cause. A hypokalaemic patient should have a low TTKG (the kidney is
 * conserving); a high one points to renal wasting rather than poor intake or a shift.
 */
export function transtubularKGradient(
  potassiumExcretionMeqPerDay: number,
  urineVolumeLPerDay: number,
  urineOsmolality: number,
  serumOsmolality: number,
  serumPotassiumMeqL: number,
): number {
  const urinePotassium = potassiumExcretionMeqPerDay / Math.max(urineVolumeLPerDay, 0.05);
  const concentrationCorrection = Math.max(urineOsmolality / Math.max(serumOsmolality, 1), 0.05);
  return urinePotassium / concentrationCorrection / Math.max(serumPotassiumMeqL, 0.5);
}

/** What this potassium level is doing to cardiac membranes — the reason any of it matters. */
export function ecgRisk(serumPotassiumMeqL: number): string {
  if (serumPotassiumMeqL >= 8) return 'sine wave — arrest imminent';
  if (serumPotassiumMeqL >= 7) return 'widened QRS, loss of P waves';
  if (serumPotassiumMeqL >= 6) return 'peaked T waves';
  if (serumPotassiumMeqL <= 2.5) return 'U waves, long QT — torsades risk';
  if (serumPotassiumMeqL <= 3) return 'flattened T waves, U waves';
  return 'normal';
}
