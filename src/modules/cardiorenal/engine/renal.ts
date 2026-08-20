import { HEMODYNAMICS, RENAL } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/**
 * Renal autoregulation: blood flow stays roughly constant across a normal MAP band,
 * falls off steeply below it (hypoperfusion), and rises modestly above it
 * (autoregulatory breakthrough) before the vessels can't compensate further.
 */
export function autoregulation(map: number): number {
  if (map < RENAL.AUTOREG_LOW_MAP) {
    return scaleClamped(map, RENAL.AUTOREG_FLOOR_MAP, RENAL.AUTOREG_LOW_MAP, 0, 1);
  }
  if (map > RENAL.AUTOREG_HIGH_MAP) {
    return scaleClamped(
      map,
      RENAL.AUTOREG_HIGH_MAP,
      RENAL.AUTOREG_CEILING_MAP,
      1,
      RENAL.AUTOREG_BREAKTHROUGH_MAX,
    );
  }
  return 1;
}

/**
 * Renal blood flow depends on nephron capacity, MAP autoregulation, AND how much
 * forward flow the heart is actually generating — a heart in failure diverts flow
 * away from the kidneys even when peripheral vasoconstriction keeps MAP normal,
 * which is the core forward-flow mechanism behind cardiorenal syndrome.
 */
export function renalBloodFlow(
  kidneyFunction: number,
  autoregulationFactor: number,
  cardiacOutput: number,
): number {
  const flowAdequacy = clamp(cardiacOutput / HEMODYNAMICS.CO_BASELINE_ML_PER_MIN, 0, 1.5);
  return kidneyFunction * autoregulationFactor * flowAdequacy;
}

export function filtrationFraction(angiotensinIIEfferentBoost: number): number {
  return clamp(
    RENAL.BASE_FILTRATION_FRACTION + angiotensinIIEfferentBoost,
    0,
    RENAL.MAX_FILTRATION_FRACTION,
  );
}

// Baseline: RBF=1.0 * FF=BASE_FILTRATION_FRACTION -> GFR=BASELINE_GFR.
const GFR_SCALE = RENAL.BASELINE_GFR / RENAL.BASE_FILTRATION_FRACTION;

export function gfr(currentRenalBloodFlow: number, currentFiltrationFraction: number): number {
  return currentRenalBloodFlow * currentFiltrationFraction * GFR_SCALE;
}

export function reabsorptionFraction(aldosteroneBoost: number, natriuresisBoost: number): number {
  return clamp(
    RENAL.REABSORPTION_BASELINE + aldosteroneBoost - natriuresisBoost,
    0,
    RENAL.REABSORPTION_MAX,
  );
}

// Calibrated so baseline GFR/reabsorption yields BASELINE_URINE_TARGET.
const URINE_SCALE =
  RENAL.BASELINE_URINE_TARGET / (RENAL.BASELINE_GFR * (1 - RENAL.REABSORPTION_BASELINE));

export function urineOutput(currentGfr: number, currentReabsorptionFraction: number): number {
  return Math.max(0, currentGfr * (1 - currentReabsorptionFraction) * URINE_SCALE);
}
