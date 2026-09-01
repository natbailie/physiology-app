/**
 * Whether the exogenous acid brings its own unmeasured anion with it.
 *
 * An organic acid (ketoacid, lactate, salicylate) consumes bicarbonate and leaves its
 * conjugate base in the plasma, widening the anion gap. A hyperchloraemic acidosis loses
 * bicarbonate with chloride taking its place, so the gap stays normal. The two look identical
 * on pH and bicarbonate alone, which is the entire reason the gap is calculated.
 */
export type AcidType = 'anionGap' | 'hyperchloraemic';

export type PrimaryDisorder =
  | 'normal'
  | 'respiratory acidosis'
  | 'respiratory alkalosis'
  | 'metabolic acidosis'
  | 'metabolic alkalosis';

export type CompensationVerdict = 'none expected' | 'appropriate' | 'inadequate' | 'more than expected';

export interface AcidBaseInterpretation {
  primary: PrimaryDisorder;
  compensation: CompensationVerdict;
  /** True when the partner value sits outside the band compensation alone could produce, so a
   * SECOND primary disorder must be present. */
  isMixed: boolean;
  /** The additional disorder the delta ratio or the compensation band exposes, if any. */
  secondary: PrimaryDisorder | null;
  /** One-line verdict, e.g. "Mixed: metabolic acidosis with respiratory alkalosis". */
  label: string;
  /** Two or three words, for a readout tile that has no room for a sentence. */
  short: string;
  /** The qualifier that goes under it — how well compensated, or what else is present. */
  detail: string;
}

export interface RespInputs {
  /** Minute ventilation effort, % of baseline where 100 = normal resting ventilation (20-300) */
  minuteVentilation: number;
  /**
   * Ventilation-perfusion mismatch, 0-1 — blood passing alveoli it cannot fully equilibrate with.
   *
   * Separate from ventilation on purpose. Hypoventilation raises CO2 and lowers O2 together, in the
   * fixed ratio the alveolar gas equation dictates; mismatch pulls them apart, devastating
   * oxygenation while the CO2 barely moves. Hypoxaemia out of proportion to hypercapnia is the
   * signature, and it is what separates an exacerbation from a chronic retainer.
   */
  vqMismatch: number;
  /** Fraction of inspired O2 — models both supplemental O2 (>0.21) and altitude-equivalent
   * hypoxia (<0.21, via reduced atmospheric pressure in this simplified model) (0.05-1.0) */
  fiO2: number;
  /** Metabolic CO2 production rate, % of baseline (50-300) — fever/sepsis/exercise raise it */
  co2Production: number;
  /** Net exogenous metabolic acid (positive, e.g. DKA ketoacids) or base (negative, e.g. vomiting)
   * production rate (-100..100) */
  metabolicAcidLoad: number;
  /** Whether a positive metabolic acid load brings unmeasured anion with it (an organic
   * acidosis) or is matched by chloride (a hyperchloraemic one). Has no effect on pH — only
   * on the anion gap, which is exactly the point. */
  acidType: AcidType;
  /** Kidney bicarbonate-handling capacity — module-local, independent of the cardiorenal
   * module's kidneyFunction input (0-1.5) */
  renalCompensationCapacity: number;
}

export interface RespState {
  /**
   * Plasma HCO3-, mEq/L — the slow "plant" variable, analogous to bloodVolume in cardiorenal.
   *
   * It is the SUM of a baseline and three bounded offsets (fast chemical buffering, slow renal
   * compensation, and whatever the exogenous acid load has consumed), not a free integral.
   * Each offset has a ceiling, so each arm settles at a defined value and the model's chronic
   * bicarbonate can be checked against the clinical compensation rules rather than merely
   * drifting past them.
   */
  plasmaHCO3: number;
  simTimeSeconds: number;
  /** Fast chemoreceptor-driven ventilation actuator, -1..1, relaxes toward target on
   * CHEMORECEPTOR.TAU_SECONDS (fastest — mirrors baroreflexDrive) */
  chemoreceptorDrive: number;
  /** Fast non-renal chemical buffering actuator (minutes), -1..1 */
  acuteBufferDrive: number;
  /** Bicarbonate contributed by that buffering right now, mEq/L */
  bufferOffsetMEqL: number;
  /** Slow renal metabolic compensation actuator (days), -1..1, gated by renalCompensationCapacity
   * (mirrors raasActivation being the slowest actuator) */
  renalCompensationDrive: number;
  /** Bicarbonate the kidney has generated or excreted, mEq/L. Bounded, so compensation is
   * always incomplete — which is why a compensated patient still has an abnormal pH. */
  renalOffsetMEqL: number;
  /** Transient airway obstruction (0-1), set by the bronchospasm perturbation, decays to 0 */
  airwayObstruction: number;
  /**
   * Bicarbonate consumed by the exogenous metabolic load, mEq/L (positive = deficit).
   *
   * Tracked separately from plasmaHCO3 because acid is CLEARED as well as produced: this
   * accumulates toward a load-proportional steady state rather than titrating the plasma
   * without limit, and it is also the quantity the anion gap reports when the acid is an
   * organic one.
   */
  metabolicAcidBurdenMEqL: number;
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
  /** Na - (Cl + HCO3), mEq/L. Normal ~12; rises only with an organic acid load. */
  anionGapMEqL: number;
  /** Change in gap over change in bicarbonate. ~1-2 in a pure organic acidosis; below that a
   * normal-gap acidosis coexists, above it a metabolic alkalosis does. */
  deltaRatio: number;
  /** PaCO2 the measured bicarbonate would justify if compensation were the only thing
   * happening, mmHg. Null when no metabolic disorder is present. */
  expectedPaCO2Range: [number, number] | null;
  /** Bicarbonate the measured PaCO2 would justify, running from the acute to the fully
   * chronic value, mEq/L. Null when no respiratory disorder is present. */
  expectedHCO3Range: [number, number] | null;
  interpretation: AcidBaseInterpretation;
  chemoreceptorDrive: number;
  acuteBufferDrive: number;
  renalCompensationDrive: number;
  airwayObstruction: number;
  /** Echoed so the diagram can draw the alveolar units that have dropped out of exchange. */
  vqMismatch: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  metabolicAcidLoad: number;
  acidType: AcidType;
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
  /** Carried explicitly rather than back-calculated: the Davenport diagram plots bicarbonate
   * against pH, and the trail is the path the patient took to get where they are. */
  plasmaHCO3: number;
}
