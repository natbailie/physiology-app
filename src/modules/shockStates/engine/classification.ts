import { CLASSIFICATION } from './constants';
import type { ShockClassification } from './types';

interface Pattern {
  cardiacIndex: number;
  centralVenousPressureMmHg: number;
  wedgePressureMmHg: number;
  effectiveSvr: number;
  meanArterialPressureMmHg: number;
  lactateMmolL: number;
}

/**
 * Reads the haemodynamic pattern the way it is read at the bedside: output first, then filling
 * pressures, then resistance.
 *
 * The point of the exercise is that no single number identifies a shock state. A low blood
 * pressure says only that something is wrong. It is the COMBINATION — is the output low or
 * high, are the filling pressures full or empty, is the resistance clamped down or wide open —
 * that names the cause, and the treatments run in opposite directions.
 */
export function classifyShock(pattern: Pattern): ShockClassification {
  const { cardiacIndex, centralVenousPressureMmHg: cvp, wedgePressureMmHg: wedge, effectiveSvr, meanArterialPressureMmHg: map, lactateMmolL } = pattern;

  // Shock is inadequate PERFUSION, not a low blood pressure. A compensating patient can hold a
  // near-normal pressure on a collapsing cardiac index, which is exactly the trap this module
  // exists to expose — so inadequate output counts even when the pressure looks acceptable.
  const inShock =
    map < CLASSIFICATION.SHOCK_MAP_MMHG ||
    lactateMmolL >= CLASSIFICATION.RAISED_LACTATE_MMOL_L ||
    cardiacIndex < CLASSIFICATION.LOW_CARDIAC_INDEX;
  if (!inShock) return 'no shock';

  // Vasodilated with preserved or high output — the resistance is the lesion, not the pump.
  if (effectiveSvr < CLASSIFICATION.LOW_SVR && cardiacIndex >= CLASSIFICATION.LOW_CARDIAC_INDEX) {
    return 'distributive';
  }

  if (cardiacIndex < CLASSIFICATION.LOW_CARDIAC_INDEX) {
    // Empty on both sides: there is not enough blood in the circuit.
    if (cvp <= CLASSIFICATION.LOW_CVP_MMHG && wedge <= CLASSIFICATION.LOW_WEDGE_MMHG) return 'hypovolaemic';
    // Full on both sides: the pump cannot clear what reaches it.
    if (cvp >= CLASSIFICATION.HIGH_CVP_MMHG && wedge >= CLASSIFICATION.HIGH_WEDGE_MMHG) return 'cardiogenic';
    // Full on the right, empty on the left: something between the two is in the way.
    if (cvp >= CLASSIFICATION.HIGH_CVP_MMHG && wedge < CLASSIFICATION.HIGH_WEDGE_MMHG) return 'obstructive';
  }

  return 'mixed / undifferentiated';
}

/** One line naming what the numbers are doing, shown under the classification so the reasoning
 * is visible rather than the label alone. */
export function patternSummary(pattern: Pattern): string {
  const output =
    pattern.cardiacIndex < CLASSIFICATION.LOW_CARDIAC_INDEX
      ? 'low output'
      : pattern.cardiacIndex > CLASSIFICATION.HIGH_CARDIAC_INDEX
        ? 'high output'
        : 'adequate output';

  const filling =
    pattern.centralVenousPressureMmHg >= CLASSIFICATION.HIGH_CVP_MMHG
      ? 'full right heart'
      : pattern.centralVenousPressureMmHg <= CLASSIFICATION.LOW_CVP_MMHG
        ? 'empty right heart'
        : 'normal filling';

  const resistance =
    pattern.effectiveSvr < CLASSIFICATION.LOW_SVR
      ? 'vasodilated'
      : pattern.effectiveSvr > CLASSIFICATION.HIGH_SVR
        ? 'vasoconstricted'
        : 'normal resistance';

  const left =
    pattern.wedgePressureMmHg >= CLASSIFICATION.HIGH_WEDGE_MMHG
      ? 'high wedge'
      : pattern.wedgePressureMmHg <= CLASSIFICATION.LOW_WEDGE_MMHG
        ? 'low wedge'
        : 'normal wedge';

  return `${output}, ${filling}, ${left}, ${resistance}`;
}
