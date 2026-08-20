export interface RespInputs {
  /** Minute ventilation effort, % of baseline where 100 = normal resting ventilation (20-300) */
  minuteVentilation: number;
  /** Fraction of inspired O2 — models both supplemental O2 (>0.21) and altitude-equivalent
   * hypoxia (<0.21, via reduced atmospheric pressure in this simplified model) (0.05-1.0) */
  fiO2: number;
  /** Metabolic CO2 production rate, % of baseline (50-300) — fever/sepsis/exercise raise it */
  co2Production: number;
  /** Net exogenous metabolic acid (positive, e.g. DKA ketoacids) or base (negative, e.g. vomiting)
   * production rate (-100..100) */
  metabolicAcidLoad: number;
  /** Kidney bicarbonate-handling capacity — module-local, independent of the cardiorenal
   * module's kidneyFunction input (0-1.5) */
  renalCompensationCapacity: number;
}

export interface RespState {
  /** Plasma HCO3-, mEq/L — the slow "plant" variable, analogous to bloodVolume in cardiorenal */
  plasmaHCO3: number;
  simTimeSeconds: number;
  /** Fast chemoreceptor-driven ventilation actuator, -1..1, relaxes toward target on
   * CHEMORECEPTOR.TAU_SECONDS (fastest — mirrors baroreflexDrive) */
  chemoreceptorDrive: number;
  /** Fast non-renal chemical buffering actuator (minutes), -1..1 */
  acuteBufferDrive: number;
  /** Slow renal metabolic compensation actuator (days), -1..1, gated by renalCompensationCapacity
   * (mirrors raasActivation being the slowest actuator) */
  renalCompensationDrive: number;
  /** Transient airway obstruction (0-1), set by the bronchospasm perturbation, decays to 0 */
  airwayObstruction: number;
}

export interface RespDerived {
  effectiveMinuteVentilation: number;
  alveolarVentilationFraction: number;
  paCO2: number;
  paO2: number;
  aaGradient: number;
  saO2: number;
  plasmaHCO3: number;
  pH: number;
  chemoreceptorDrive: number;
  acuteBufferDrive: number;
  renalCompensationDrive: number;
  airwayObstruction: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  metabolicAcidLoad: number;
  renalCompensationCapacity: number;
}

export interface RespSnapshot {
  state: RespState;
  derived: RespDerived;
}

export interface RespHistoryPoint {
  t: number;
  pH: number;
  paCO2: number;
  saO2: number;
}
