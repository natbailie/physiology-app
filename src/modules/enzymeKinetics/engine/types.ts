export type InhibitorType = 'none' | 'competitive' | 'noncompetitive' | 'uncompetitive';

export interface KineticsInputs {
  /** Substrate concentration [S], mmol/L (0-20). */
  substrateMm: number;
  /** Max velocity Vmax at 37°C and pH 7.4, µmol/min (5-200). */
  vmaxUmPerMin: number;
  /** Michaelis constant Km, mmol/L (0.05-10) — the [S] giving half-maximal velocity. */
  kmMm: number;
  inhibitorType: InhibitorType;
  /** Inhibitor concentration [I], µmol/L (0-100). */
  inhibitorUm: number;
  /** Inhibition constant Ki, µmol/L (0.2-50). */
  kiUm: number;
  /** Reaction temperature, °C (10-50). Rate roughly doubles per 10°C — until heat denatures
   * the enzyme and it collapses instead. */
  temperatureC: number;
  /** Reaction pH (4-9). Enzymes have an optimum; acidaemia is a whole-body version of this. */
  ph: number;
}

export interface KineticsInternalState {
  simTimeSeconds: number;
  /** Smoothed reaction rate, µmol/min — the algebraic rate approached over ~a second so the
   * readout moves like an instrument rather than teleporting when a slider jumps. */
  observedRateUmPerMin: number;
}

export interface KineticsDerived {
  /** Michaelis-Menten velocity at the CURRENT substrate concentration after all factors. */
  reactionRateUmPerMin: number;
  /** Apparent Vmax after inhibition and environmental factors, µmol/min. */
  apparentVmaxUmPerMin: number;
  /** Apparent Km after inhibition, mmol/L — what competitive inhibitors specifically raise. */
  apparentKmMm: number;
  /** Fraction of active sites occupied at the current [S], %. */
  saturationPct: number;
  /** Residual activity as % of the uninhibited, optimally-conditioned rate. */
  residualActivityPct: number;
  temperatureFactor: number;
  phFactor: number;
  inhibitorType: InhibitorType;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  substrateMm: number;
  vmaxUmPerMin: number;
  kmMm: number;
  temperatureC: number;
  ph: number;
}

export interface KineticsSnapshot {
  state: KineticsInternalState;
  derived: KineticsDerived;
}

export interface KineticsHistoryPoint {
  t: number;
  rate: number;
  saturationPct: number;
}
