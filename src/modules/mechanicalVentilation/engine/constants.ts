import type { MvHistoryPoint, MvInputs, MvState } from './types';

export const MV_SIMULATION = {
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 33,
  /** ~8s of real time at the render interval: the pressure waveform needs ~3 cycles on screen. */
  HISTORY_CAPACITY: 240,
  /** Runs in real time — a breath a second is already readable. */
  TIME_SCALE: 1,
  /** Simulated seconds of settling applied before the first frame. The model is steady-state
   * in gas exchange, so this clears any transient the breath clock starts on. */
  SETTLE_SECONDS: 6,
} as const;

/** Physiological model constants. Everything inside stays unit-consistent with the inputs:
 * mL, cmH2O, L/s, breaths/min. */
export const MV_PHYSIOLOGY = {
  /** Fraction of the breath spent inspiring. */
  INSPIRATORY_FRACTION: 0.4,
  /** The alveolar gas-equation quotient between CO2 production and O2 uptake. */
  RESPIRATORY_QUOTIENT: 0.8,
  HEMOGLOBIN_G_PER_DL: 15,
  MIXED_VENOUS_SVO2: 0.72,
  MIXED_VENOUS_PO2_MMHG: 40,
  /** Basal ventilation that clears a normal CO2 load at 40 mmHg (VA_basal, mL/min). */
  BASAL_ALVEOLAR_VENTILATION_ML_PER_MIN: 4200,
  /** Pressure support in cmH2O that fully carries a breath; at or above it the patient's own
   * effort need no longer contribute. */
  SUPPORT_WOB_CEILING_CMH2O: 10,
} as const;

export const MV_VENTILATOR = {
  /** CPAP starts splinting a collapsible airway once EPAP clears this level (cmH2O). */
  CPAP_SPLINT_THRESHOLD_CMH2O: 2,
  /** EPAP range over which CPAP reaches full splint (cmH2O). */
  CPAP_SPLINT_RANGE_CMH2O: 8,
  /** NIV leaks ~15% of the delivered support volume at the mask. */
  NIV_LEAK_EFFICIENCY: 0.85,
  /** Mean airway pressure sits this far above PEEP. */
  MEAN_AIRWAY_PRESSURE_FRACTION: 0.4,
  /** Gas emptying time-constant = resistance × compliance × this conversion (s). */
  RESISTANCE_TO_TC_S: 0.001,
  /** Exponential emptying frame — 3 time-constants empties a lung. */
  EMPTY_AT_TC: 3,
  /** Auto-PEEP accumulated per unit of trapping per unit of resistance (cmH2O). */
  TRAPPED_PEEP_GAIN_CMH2O: 1,
  /** Dead space that trapping adds, per unit of trapping. */
  TRAPPED_DEADSPACE_GAIN: 0.35,
  /** PEEP at and beyond which recruitment engages, and the range of PEEP over which it peaks. */
  RECRUITMENT_PEEP_OFFSET_CMH2O: 4,
  RECRUITMENT_PEEP_RANGE_CMH2O: 8,
  MAX_DEAD_SPACE_FRACTION: 0.8,
  /** Geometric guard: at the compensation end the inverse Severinghaus cubic stays solvable.
   * Kept just under 1 so the closed-form root stays well-conditioned at ceil FiO2. */
  MAX_SV02_SAT: 0.9999,
  MIN_PAO2_MMHG: 20,
  MAX_PAO2_MMHG: 650,
  MIN_PCO2_MMHG: 10,
  MAX_PCO2_MMHG: 150,
} as const;

export const MV_INTERPRETATION = {
  HYPOCAPNIA_MMHG: 45,
  HYPOXAEMIA_BORDERLINE_MMHG: 80,
  HYPOXAEMIA_SEVERE_MMHG: 60,
  DRIVING_ELEVATED_CMH2O: 12,
  DRIVING_HIGH_CMH2O: 15,
  PLATEAU_ALARM_CMH2O: 28,
  RESISTIVE_PRESSURE_CEILING_CMH2O: 10,
  ACUTE_HCO3_SLOPE: 0.1,
  CHRONIC_HCO3_SLOPE: 0.35,
} as const;

export function makeInitialState(): MvState {
  return { simTimeSeconds: 0, breathPhaseFraction: 0 };
}

export function makeInitialHistoryPoint(t: number): MvHistoryPoint {
  return { t, pressure: 0, tidalVolume: 0 };
}

/** The calibrated baseline: normal patient on 2 cmH2O of CPAP at room air. VA = 4200 mL/min →
 * PaCO2 40. */
export function defaultInputs(): MvInputs {
  return {
    mode: 'cpap',
    epapPeepCmH2O: 2,
    ipapPipCmH2O: 10,
    ventRatePerMin: 12,
    fiO2: 0.21,
    complianceMLPerCmH2O: 100,
    airwayResistanceCmH2OPerLPerSec: 1,
    deadSpaceFraction: 0.3,
    shuntFraction: 0.02,
    nativeDrive: 1,
    nativeRatePerMin: 12,
    nativeTidalVolumeML: 500,
    recruitability: 0.6,
    upperAirwayCollapse: 0,
    intrinsicPeepCmH2O: 0,
    co2ProductionMultiplier: 1,
    chronicKidneyCompensation: 0,
  };
}