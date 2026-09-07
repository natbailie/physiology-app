export type FailureType = 'none' | 'type 1' | 'type 2' | 'mixed';

export type HypoxaemiaGrade = 'none' | 'borderline' | 'severe';

export interface RfInputs {
  /** Inspired oxygen fraction, 0.21–1.0 — the only lever that moves PaO2 without moving CO2. */
  fiO2: number;
  /** Minute ventilation, L/min — the air the patient actually moves every minute. */
  minuteVentilation: number;
  /** Blood travelling through lung that is perfused but not ventilated, 0–0.6 — the shunt that
   * drags PaO2 down whatever FiO2 does. */
  shuntFraction: number;
  /** CO2 production relative to normal — sepsis and a heavy meal raise it. */
  co2ProductionMultiplier: number;
  /** How long the hypercapnia has run: the kidney only catches up when it has had days. */
  course: 'acute' | 'chronic';
}

export interface RfState {
  simTimeSeconds: number;
}

export interface RfDerived {
  /** Alveolar ventilation, mL/min — every breathed litre minus the dead third. */
  alveolarVentilationMLPerMin: number;
  /** The shunt that survives — equal to the input; kept derived so it can be read as a %. */
  effectiveShuntFraction: number;
  paO2: number;
  paCO2: number;
  saO2: number;
  pH: number;
  plasmaHCO3: number;
  alveolarPAO2: number;
  aaGradient: number;
  paO2FiO2Ratio: number;
  hypoxaemia: HypoxaemiaGrade;
  failureType: FailureType;
  respiratoryAcidosis: boolean;
}

export interface RfSnapshot {
  state: RfState;
  derived: RfDerived;
}

export interface RfHistoryPoint {
  t: number;
  paO2: number;
  paCO2: number;
}