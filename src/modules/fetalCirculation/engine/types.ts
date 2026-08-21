export type CirculationPhase =
  | 'fetal'
  | 'transitional'
  | 'neonatal'
  | 'persistent fetal circulation'
  | 'left-to-right shunt';

export interface FetalInputs {
  /** Placental circulation remaining, fraction (0-1). 1 is an intact cord; 0 is clamped.
   * The placenta is a huge low-resistance bed, so removing it RAISES systemic resistance. */
  placentalCirculation: number;
  /** Lung aeration, fraction (0-1). 0 is fluid-filled; the first breath drives it toward 1. */
  lungInflation: number;
  /** Inspired oxygen fraction (0.21-1). Oxygen is a pulmonary vasodilator and a ductal
   * constrictor — it acts on both shunts at once, in opposite directions. */
  inspiredOxygen: number;
  /** How readily the pulmonary vasculature relaxes, fraction of normal (0-2). Low models
   * persistent pulmonary hypertension of the newborn. */
  pulmonaryVasoreactivity: number;
  /** Prostaglandin E level, % of the dose used to keep a duct open (0-100). High in utero
   * from the placenta; given deliberately in duct-dependent lesions. */
  prostaglandinLevel: number;
  /** Systemic vascular resistance modifier, multiple of normal (0.4-2), excluding the
   * placental contribution. */
  systemicToneScale: number;
}

export interface FetalState {
  simTimeSeconds: number;
  /** Pulmonary vascular resistance, multiple of the mature neonatal value. Starts very high. */
  pulmonaryVascularResistance: number;
  /** Ductus arteriosus patency, 0..1. Closes over hours once oxygenated and prostaglandin falls. */
  ductusArteriosusPatency: number;
  /** Foramen ovale patency, 0..1. Closes FUNCTIONALLY the moment left atrial pressure exceeds
   * right — a flap held shut by pressure, long before it seals anatomically. */
  foramenOvalePatency: number;
  /** Ductus venosus patency, 0..1 — the bypass around the liver, redundant once the cord is cut. */
  ductusVenosusPatency: number;
}

export interface FetalDerived {
  pulmonaryVascularResistance: number;
  systemicVascularResistance: number;
  ductusArteriosusPatency: number;
  foramenOvalePatency: number;
  ductusVenosusPatency: number;
  /** Fraction of right ventricular output that reaches the lungs rather than crossing the duct. */
  pulmonaryFlowFraction: number;
  /** Signed ductal shunt as a fraction of output. Positive is RIGHT-to-left (fetal pattern);
   * negative is left-to-right (the pattern of a persistent duct after transition). */
  ductalShuntFraction: number;
  /** Signed atrial shunt. Positive is right-to-left across the foramen ovale. */
  atrialShuntFraction: number;
  rightAtrialPressureMmHg: number;
  leftAtrialPressureMmHg: number;
  /** Saturation of blood leaving the oxygenating organ — placenta before birth, lung after. */
  oxygenatedSourceSaturation: number;
  /** Right arm: aortic blood upstream of the duct. */
  preDuctalSaturationPercent: number;
  /** Lower body: aortic blood after any ductal shunt has mixed into it. */
  postDuctalSaturationPercent: number;
  /** Pre minus post. A positive gap is differential cyanosis — pink above, blue below. */
  saturationGradientPercent: number;
  phase: CirculationPhase;
  shuntSummary: string;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  placentalCirculation: number;
  lungInflation: number;
  inspiredOxygen: number;
  pulmonaryVasoreactivity: number;
  prostaglandinLevel: number;
  systemicToneScale: number;
}

export interface FetalSnapshot {
  state: FetalState;
  derived: FetalDerived;
}

export interface FetalHistoryPoint {
  t: number;
  pvr: number;
  preDuctal: number;
  postDuctal: number;
  ductus: number;
  pulmonaryFlow: number;
}
