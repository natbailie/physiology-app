export type VentMode = 'cpap' | 'niv' | 'invasive';

export type FailureType = 'none' | 'type 1' | 'type 2' | 'mixed';

export type ViliRisk = 'low' | 'elevated' | 'high';

export type HypoxaemiaGrade = 'none' | 'borderline' | 'severe';

export interface MvInputs {
  /** The ventilation interface: CPAP holds one expiratory pressure, NIV/BiPAP supports each
   * breath with IPAP − EPAP, invasive ventilation delivers set PIP at a set rate. */
  mode: VentMode;
  /** Expiratory positive airway pressure: PEEP (invasive) or EPAP (CPAP/NIV), cmH2O. */
  epapPeepCmH2O: number;
  /** Inspiratory pressure: IPAP in NIV, peak inspiratory pressure in invasive, cmH2O. */
  ipapPipCmH2O: number;
  /** Ventilator back-up rate, breaths/min — only drives ventilation when it exceeds the
   * patient's own rate (or is the only driver in invasive ventilation). */
  ventRatePerMin: number;
  /** Inspired oxygen fraction, 0.21-1.0. */
  fiO2: number;
  // ------------------------------------------------------------------
  // Patient physiology, dialed by the scenario presets rather than the vent rail. A
  // ventilator is set against a patient; these are that patient.
  /** Respiratory-system compliance, mL/cmH2O — low means stiff lungs (ARDS, fibrosis). */
  complianceMLPerCmH2O: number;
  /** Airway resistance, cmH2O/L/s — high means obstruction (COPD), and airflow now takes a
   * resistive pressure drop between the set peak and the plateau. */
  airwayResistanceCmH2OPerLPerSec: number;
  /** Wasted dead-space ventilation as a fraction of each tidal volume. */
  deadSpaceFraction: number;
  /** True shunt as a fraction of cardiac output passing unventilated units — the assault on
   * PaO2 that PEEP recruits and that oxygen alone cannot fix. */
  shuntFraction: number;
  /** The patient's own inspiratory effort, 0-1 — what pressure support is supporting. */
  nativeDrive: number;
  nativeRatePerMin: number;
  nativeTidalVolumeML: number;
  /** How much of the collapsed lung PEEP reopens, 0-1. ARDS grades high, emphysema low. */
  recruitability: number;
  /** Upper-airway collapse tendency, 0-1 — what CPAP splints in obstructive sleep apnoea. */
  upperAirwayCollapse: number;
  /** Baseline auto-PEEP already trapping gas before the vent, cmH2O. */
  intrinsicPeepCmH2O: number;
  /** CO2 production relative to normal. */
  co2ProductionMultiplier: number;
  /** 0 = acute, unchanged bicarbonate; 1 = the kidney has had days and bicarbonate follows. */
  chronicKidneyCompensation: number;
}

export interface MvState {
  simTimeSeconds: number;
  /** Position within the current breath, 0..1 (0-0.4 inspiration, rest expiration). */
  breathPhaseFraction: number;
}

export interface MvDerived {
  mode: VentMode;
  /** End-inspiratory airway pressure: what the ventilator supports each breath to, cmH2O. */
  inspiratoryPressureCmH2O: number;
  /** Peak airway pressure — the inspiratory pressure plus whatever the resistance eats, cmH2O. */
  peakPressureCmH2O: number;
  /** Pressure support / driving pressure for the current mode, cmH2O. */
  supportPressureCmH2O: number;
  /** Plateau minus dialled PEEP — the stretch each breath puts the lung under, cmH2O. */
  drivingPressureCmH2O: number;
  meanAirwayPressureCmH2O: number;
  /** Auto-PEEP accumulating from incomplete emptying, cmH2O. */
  intrinsicPeepCmH2O: number;
  totalPeepCmH2O: number;
  /** Instantaneous airway pressure during the breath, cmH2O — the waveform. */
  airwayPressureCmH2O: number;
  breathPhaseFraction: number;
  tidalVolumeML: number;
  effectiveRatePerMin: number;
  minuteVentilationMLPerMin: number;
  alveolarVentilationMLPerMin: number;
  /** How far PEEP has reopened collapsed lung, 0-1. */
  recruitmentLevel: number;
  /** The shunt that survives recruitment — the one oxygen cannot reach. */
  effectiveShuntFraction: number;
  /** Anatomical dead space plus whatever trapped gas the lung could not empty. */
  effectiveDeadSpaceFraction: number;
  /** Incomplete emptying, 0-1. */
  airTrapping: number;
  /** The patient's ventilatory effort as a percentage of unsupported work, 0-100. */
  wobEffortPct: number;
  paO2: number;
  paCO2: number;
  saO2: number;
  pH: number;
  plasmaHCO3: number;
  aaGradient: number;
  paO2FiO2Ratio: number;
  failureType: FailureType;
  hypoxaemia: HypoxaemiaGrade;
  viliRisk: ViliRisk;
  respiratoryAcidosis: boolean;
}

export interface MvSnapshot {
  state: MvState;
  derived: MvDerived;
}

export interface MvHistoryPoint {
  t: number;
  pressure: number;
  tidalVolume: number;
}