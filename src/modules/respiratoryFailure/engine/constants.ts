import type { RfInputs, RfState } from './types';

export const RF_SIMULATION = {
  MAX_DT_SECONDS: 0.5,
  SETTLE_SECONDS: 0.5,
  RENDER_INTERVAL_MS: 80,
  HISTORY_CAPACITY: 120,
  TIME_SCALE: 1,
} as const;

export const RF_PHYSIOLOGY = {
  /** Gas exchange lives in the lungs, not the metre dial — a constant. */
  ZERO_FiO2: 0.21,
  /** Haemoglobin concentration, g/dL. */
  HAEMOGLOBIN_G_PER_DL: 15,
  /** O2 carried per gram of saturated haemoglobin, mL/g. */
  O2_BINDING_CAPACITY: 1.34,
  /** Soluble O2, not bound to haemoglobin, mL/dL/mmHg. */
  O2_SOLUBILITY: 0.0031,
  /** Resting VO2 that the mixed venous-arterial O2 gap closes back to, vol%. */
  AV_O2_CONTENT_DIFFERENCE_VOL_PCT: 5,
  /** The third of each breath that never reaches alveoli. */
  DEAD_SPACE_FRACTION: 0.3,
  /** The alveolar ventilation that holds PaCO2 at 40 with a resting CO2 load, mL/min. */
  NORMAL_ALVEOLAR_VENTILATION_ML_PER_MIN: 4200,
  /** Resting CO2 production relative to this that defines PaCO2 = 40. */
  NORMAL_CO2_PRODUCTION: 1,
} as const;

export const RF_GAS = {
  BAROMETRIC_PRESSURE_MMHG: 760,
  WATER_VAPOUR_PRESSURE_MMHG: 47,
  RESPIRATORY_QUOTIENT: 0.8,
  /** Bounds for the PaO2 bisection solver. */
  MIN_PAO2: 4,
  MAX_PAO2: 650,
  /** Oxyhaemoglobin dissociation curve: PaO2 (mmHg) at 50% saturation. */
  P50_MMHG: 26.6,
  /** Hill coefficient for the dissociation curve. */
  HILL_N: 2.7,
} as const;

export const FAILURE_THRESHOLDS = {
  HYPOXAEMIA_PAO2: 60,
  BORDERLINE_HYPOXAEMIA_PAO2: 80,
  HYPERCAPNIA_PACO2: 45,
} as const;

export const DEFAULT_RF_INPUTS: RfInputs = {
  fiO2: 0.21,
  minuteVentilation: 6,
  shuntFraction: 0.02,
  co2ProductionMultiplier: 1,
  course: 'acute',
};

export function makeInitialState(): RfState {
  return { simTimeSeconds: 0 };
}