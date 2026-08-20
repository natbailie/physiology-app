export type LimitingFactor = 'preload' | 'pump' | 'afterload';

export interface VenousReturnInputs {
  /** Total blood volume, mL (3000-7000). */
  bloodVolumeMl: number;
  /** Venous compliance, multiple of normal (0.3-3). The veins hold about two thirds of the
   * blood at a twentieth of the arterial pressure precisely because they are this compliant. */
  venousCompliance: number;
  /** Fraction of blood volume that is UNSTRESSED — filling the vessels without stretching them,
   * and therefore generating no pressure at all (0.6-0.95). Venoconstriction converts unstressed
   * volume into stressed volume without adding a drop of blood, which is how sympathetic
   * activity raises cardiac output before any fluid is given. */
  unstressedVolumeFraction: number;
  /** Cardiac contractility, multiple of normal (0-2.5). Moves the cardiac function curve. */
  contractility: number;
  /** Heart rate, beats per minute (30-200). */
  heartRate: number;
  /** Systemic vascular resistance, multiple of normal (0.3-3). Acts twice: as afterload on the
   * heart, and as part of the resistance to venous return. */
  systemicVascularResistance: number;
  /** Venous resistance, multiple of normal (0.3-3) — the dominant term in resistance to venous
   * return, because the veins carry the same flow at a fraction of the pressure gradient. */
  venousResistance: number;
  /** Intrathoracic pressure, mmHg (-10 to +20). Normally negative; positive-pressure ventilation
   * and a Valsalva manoeuvre make it positive, which shifts the cardiac function curve to the
   * right and lowers cardiac output at any given right atrial pressure. */
  intrathoracicPressure: number;
  /** Arteriovenous shunt fraction, 0-1. A fistula bypasses the arterioles, collapsing the
   * resistance to venous return and raising cardiac output without the heart doing anything
   * different. */
  arteriovenousShunt: number;
}

export interface VenousReturnState {
  simTimeSeconds: number;
  /** Right atrial pressure, mmHg — the plant variable. It is NOT solved for: it rises when
   * venous return exceeds cardiac output and falls when it does not, so the operating point
   * where the two curves cross emerges from mass balance rather than from algebra. */
  rightAtrialPressureMmHg: number;
  /** Blood gained or lost by haemorrhage or transfusion, mL, on top of the slider value. */
  volumeOffsetMl: number;
  /** Transient rise in intrathoracic pressure from a Valsalva manoeuvre, mmHg. */
  intrathoracicSurgeMmHg: number;
}

export interface CurvePoint {
  pra: number;
  flow: number;
}

export interface VenousReturnDerived {
  rightAtrialPressureMmHg: number;
  /** Mean systemic filling pressure: the pressure everywhere in the circulation if the heart
   * stopped and pressures equalised. It is set by stressed volume and compliance — by the
   * VESSELS, not the heart — and it is the upstream pressure driving all venous return. */
  meanSystemicFillingPressureMmHg: number;
  totalBloodVolumeMl: number;
  stressedVolumeMl: number;
  unstressedVolumeMl: number;
  totalComplianceMlPerMmHg: number;
  resistanceToVenousReturn: number;
  effectiveIntrathoracicPressure: number;
  /** Flow along each curve at the CURRENT right atrial pressure. Where they differ, the atrium
   * is filling or emptying and the pressure is still moving. */
  venousReturnLPerMin: number;
  cardiacOutputLPerMin: number;
  /** Where the two curves cross — the steady state the system is heading for. */
  operatingPointPra: number;
  operatingPointFlow: number;
  /** Maximum output the heart could produce at any filling pressure, L/min. */
  cardiacCurvePlateau: number;
  limitingFactor: LimitingFactor;
  meanArterialPressureMmHg: number;
  /** Sampled curves for plotting. */
  cardiacCurve: CurvePoint[];
  venousCurve: CurvePoint[];
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  bloodVolumeMl: number;
  venousCompliance: number;
  unstressedVolumeFraction: number;
  contractility: number;
  heartRate: number;
  systemicVascularResistance: number;
  venousResistance: number;
  intrathoracicPressure: number;
  arteriovenousShunt: number;
}

export interface VenousReturnSnapshot {
  state: VenousReturnState;
  derived: VenousReturnDerived;
}

export interface VenousReturnHistoryPoint {
  t: number;
  pra: number;
  cardiacOutput: number;
  venousReturn: number;
  meanSystemicFillingPressure: number;
}
