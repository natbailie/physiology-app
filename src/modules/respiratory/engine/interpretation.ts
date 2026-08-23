import { INTERPRETATION } from './constants';
import type { AcidBaseInterpretation, CompensationVerdict, PrimaryDisorder } from './types';

/** Expected PaCO2 for a metabolic disorder — Winter's formula below the normal bicarbonate,
 * the shallower hypoventilation rule above it. Returns the tolerance band, not a point. */
export function expectedPaCO2Range(plasmaHCO3: number): [number, number] {
  const acidotic = plasmaHCO3 < INTERPRETATION.NORMAL_HCO3_MEQ_L;
  const centre = acidotic
    ? INTERPRETATION.WINTERS_SLOPE * plasmaHCO3 + INTERPRETATION.WINTERS_INTERCEPT
    : INTERPRETATION.ALKALOSIS_SLOPE * plasmaHCO3 + INTERPRETATION.ALKALOSIS_INTERCEPT;
  const tolerance = acidotic ? INTERPRETATION.WINTERS_TOLERANCE : INTERPRETATION.ALKALOSIS_TOLERANCE;
  return [centre - tolerance, centre + tolerance];
}

/**
 * Expected bicarbonate for a respiratory disorder, running from the ACUTE value to the fully
 * chronic one.
 *
 * A range rather than a number, deliberately. One blood gas cannot tell you how long a PaCO2
 * has been abnormal, and the bicarbonate a patient is entitled to depends entirely on that —
 * a PaCO2 of 70 justifies a bicarbonate of 27 on the first day and 34 after a fortnight. Only
 * a value outside the WHOLE band proves a second disorder. Collapsing this to a single
 * expected value is the commonest way an interpretation goes wrong.
 */
export function expectedHCO3Range(currentPaCO2: number): [number, number] {
  const deviation = (currentPaCO2 - INTERPRETATION.NORMAL_PACO2_MMHG) / 10;
  const [acutePer10, chronicPer10] =
    deviation >= 0
      ? [INTERPRETATION.ACIDOSIS_ACUTE_HCO3_PER_10, INTERPRETATION.ACIDOSIS_CHRONIC_HCO3_PER_10]
      : [INTERPRETATION.ALKALOSIS_ACUTE_HCO3_PER_10, INTERPRETATION.ALKALOSIS_CHRONIC_HCO3_PER_10];

  const acute = INTERPRETATION.NORMAL_HCO3_MEQ_L + deviation * acutePer10;
  const chronic = INTERPRETATION.NORMAL_HCO3_MEQ_L + deviation * chronicPer10;
  const low = Math.min(acute, chronic) - INTERPRETATION.RESPIRATORY_TOLERANCE;
  const high = Math.max(acute, chronic) + INTERPRETATION.RESPIRATORY_TOLERANCE;
  return [low, high];
}

/**
 * Names the primary disorder.
 *
 * The rule is that compensation never overshoots, so whichever of PaCO2 and bicarbonate has
 * moved in the direction that EXPLAINS the pH is the primary problem. An acidaemic patient
 * with a high PaCO2 has a respiratory acidosis whatever their bicarbonate is doing, because
 * hypoventilation cannot be a response to acidaemia — the chemoreceptors would be driving
 * ventilation the other way.
 */
export function primaryDisorder(pH: number, currentPaCO2: number, plasmaHCO3: number): PrimaryDisorder {
  const acidaemic = pH < INTERPRETATION.NORMAL_PH_MIN;
  const alkalaemic = pH > INTERPRETATION.NORMAL_PH_MAX;

  const co2Excess = currentPaCO2 - INTERPRETATION.NORMAL_PACO2_MMHG;
  const hco3Deficit = INTERPRETATION.NORMAL_HCO3_MEQ_L - plasmaHCO3;

  if (acidaemic) {
    // Both can be true in a mixed acidosis; the larger relative derangement names the primary.
    return co2Excess / 10 > hco3Deficit / 5 ? 'respiratory acidosis' : 'metabolic acidosis';
  }
  if (alkalaemic) {
    return -co2Excess / 10 > -hco3Deficit / 5 ? 'respiratory alkalosis' : 'metabolic alkalosis';
  }

  // A normal pH does not mean a normal patient. If both components are deranged and have moved
  // together, two opposing disorders (or one fully compensated one) are cancelling out. The
  // thresholds are deliberately low: a well-compensated disorder is precisely the case where
  // both numbers are abnormal and the pH is not, and calling that "normal" is the single most
  // common way a blood gas gets misread.
  if (Math.abs(co2Excess) > 4 && Math.abs(hco3Deficit) > 2.5) {
    if (co2Excess > 0) return 'respiratory acidosis';
    return 'respiratory alkalosis';
  }
  if (Math.abs(hco3Deficit) > 2.5) return hco3Deficit > 0 ? 'metabolic acidosis' : 'metabolic alkalosis';
  return 'normal';
}

const LABELS: Record<PrimaryDisorder, string> = {
  normal: 'Normal',
  'respiratory acidosis': 'Respiratory acidosis',
  'respiratory alkalosis': 'Respiratory alkalosis',
  'metabolic acidosis': 'Metabolic acidosis',
  'metabolic alkalosis': 'Metabolic alkalosis',
};

/** The disorder implied when the partner value is deranged past what compensation explains. */
function secondaryFrom(primary: PrimaryDisorder, measured: number, band: [number, number]): PrimaryDisorder | null {
  const respiratoryPrimary = primary === 'respiratory acidosis' || primary === 'respiratory alkalosis';
  if (measured > band[1]) return respiratoryPrimary ? 'metabolic alkalosis' : 'respiratory acidosis';
  if (measured < band[0]) return respiratoryPrimary ? 'metabolic acidosis' : 'respiratory alkalosis';
  return null;
}

/**
 * The full verdict: what the primary disorder is, whether the partner value is where
 * compensation alone would put it, and — when it is not — what second disorder that exposes.
 *
 * This is the whole of blood gas interpretation in one function, and every number in it is a
 * clinical rule rather than a fitted constant. The engine is calibrated to the same rules
 * (the acute buffer to ~1 mEq/L per 10 mmHg, renal compensation to ~3.5), so a chronically
 * hypercapnic patient the model has settled reads back as appropriately compensated.
 */
export function interpret(
  pH: number,
  currentPaCO2: number,
  plasmaHCO3: number,
  anionGap: number,
  deltaRatio: number,
): AcidBaseInterpretation {
  const primary = primaryDisorder(pH, currentPaCO2, plasmaHCO3);

  if (primary === 'normal') {
    return {
      primary,
      compensation: 'none expected',
      isMixed: false,
      secondary: null,
      label: 'Normal acid-base status',
      short: 'Normal',
      detail: 'no primary disorder',
    };
  }

  const respiratoryPrimary = primary === 'respiratory acidosis' || primary === 'respiratory alkalosis';
  const band = respiratoryPrimary ? expectedHCO3Range(currentPaCO2) : expectedPaCO2Range(plasmaHCO3);
  const measured = respiratoryPrimary ? plasmaHCO3 : currentPaCO2;

  const secondary = secondaryFrom(primary, measured, band);
  let compensation: CompensationVerdict = 'appropriate';
  if (secondary !== null) {
    // Whether the partner value falls short of the band or overshoots it, the label a learner
    // needs is the same: compensation cannot account for this on its own.
    const overshoot = measured > band[1];
    const drivesSameWay =
      (primary === 'metabolic acidosis' && !overshoot) ||
      (primary === 'metabolic alkalosis' && overshoot) ||
      (primary === 'respiratory acidosis' && overshoot) ||
      (primary === 'respiratory alkalosis' && !overshoot);
    compensation = drivesSameWay ? 'more than expected' : 'inadequate';
  }

  // The delta ratio finds a disorder the compensation band cannot: it compares two METABOLIC
  // processes against each other, so it works even when the bicarbonate looks unremarkable.
  const gapAcidosis = anionGap > 16;
  const deltaSecondary: PrimaryDisorder | null =
    gapAcidosis && deltaRatio !== 0
      ? deltaRatio < INTERPRETATION.DELTA_RATIO_MIN
        ? 'metabolic acidosis'
        : deltaRatio > INTERPRETATION.DELTA_RATIO_MAX
          ? 'metabolic alkalosis'
          : null
      : null;

  const resolvedSecondary = secondary ?? deltaSecondary;
  const isMixed = resolvedSecondary !== null;

  const label = isMixed
    ? `Mixed: ${LABELS[primary].toLowerCase()} with ${LABELS[resolvedSecondary].toLowerCase()}`
    : `${LABELS[primary]}, appropriately compensated`;
  const short = isMixed ? 'Mixed disorder' : LABELS[primary];
  const detail = isMixed
    ? `${LABELS[primary].toLowerCase()} + ${LABELS[resolvedSecondary].toLowerCase()}`
    : 'compensation appropriate';

  return { primary, compensation, isMixed, secondary: resolvedSecondary, label, short, detail };
}
