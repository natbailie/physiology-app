export interface AnaesthesiaInputs {
  /** Vaporizer dial, percent of inspired agent the fresh gas is set to deliver. */
  dialPct: number;
  /** Fresh gas flow into the circuit, L/min. Low flows re-breathe and dilute the dial. */
  freshGasFlowLMin: number;
  /** Blood:gas partition coefficient — 0.45 desflurane, 0.65 sevoflurane, 1.4 isoflurane, 2.3 halothane. */
  bloodGasSolubility: number;
  /** Cardiac output, L/min. The blood column that carries agent out of the lungs and to the brain. */
  cardiacOutputLMin: number;
}

export interface AnaesthesiaInternalState {
  simTimeSeconds: number;
  /** Alveolar agent concentration, percent — the fraction of the dial that has actually reached the gas in the lungs. */
  alveolarAgentPct: number;
  /** Effect-site (brain) concentration, percent — lags the alveoli by the partition coefficient. */
  effectSiteAgentPct: number;
}

export interface AnaesthesiaDerived {
  /** The reflected dial, so the learner can see the setting next to what is happening in the lungs. */
  dialPct: number;
  freshGasFlowLMin: number;
  bloodGasSolubility: number;
  cardiacOutputLMin: number;
  /** Effective inspired concentration at the Y-piece after circuit re-breathing dilution, percent. */
  inspiredFractionPct: number;
  /** Inspired as a fraction of the dial — how much of the dial setting the circuit is actually delivering. */
  inspiredToDialRatio: number;
  /** Alveolar concentration, percent (the state). */
  alveolarAgentPct: number;
  /** Effect-site brain concentration, percent (the state). */
  effectSiteAgentPct: number;
  /** How far wash-in has gone: alveolar over its own equilibrium ceiling, 0-1. */
  washInProgress: number;
  /** Minutes to reach 90% of the equilibrium ceiling at the current flows and solubility. */
  timeTo90PctMinutes: number;
  /** Minutes to reach 50% of the equilibrium ceiling — the classic induction yardstick. */
  timeTo50PctMinutes: number;
  /** Whole-body uptake index: solubility × cardiac output × current alveolar level. */
  absorptionIndex: number;
  /** Anaesthetic phase the learner is watching. */
  state: string;
}

export interface AnaesthesiaSnapshot {
  state: AnaesthesiaInternalState;
  derived: AnaesthesiaDerived;
}

export interface AnaesthesiaHistoryPoint {
  t: number;
  alveolar: number;
  brain: number;
}