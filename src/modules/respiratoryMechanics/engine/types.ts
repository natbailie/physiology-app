export type SpirometryPattern = 'normal' | 'obstructive' | 'restrictive' | 'mixed';

export interface RespMechInputs {
  /** Respiratory rate, breaths/min (8-40) */
  respiratoryRate: number;
  /** Tidal volume, mL (300-1000) */
  tidalVolumeML: number;
  /** Lung compliance, mL/cmH2O (20-150) — low models fibrosis (stiff lungs) */
  lungCompliance: number;
  /** Airway resistance, cmH2O/L/s (0.5-20) — high models obstruction */
  airwayResistance: number;
  /** Surfactant function, fraction (0-1.5) — low raises surface tension and stiffens the lung
   * independently of the intrinsic tissue compliance; 0 models neonatal RDS */
  surfactantFunction: number;
  /** Dead space fraction, % of tidal volume (0-70) — ventilated but NOT perfused alveoli,
   * as in pulmonary embolism */
  deadSpaceFraction: number;
  /** Shunt fraction, % of cardiac output (0-50) — perfused but NOT ventilated alveoli, as in
   * pneumonia or atelectasis */
  shuntFraction: number;
  /** Hypoxic pulmonary vasoconstriction strength, fraction (0-1.5) — diverts perfusion away
   * from poorly ventilated lung */
  hpvStrength: number;
}

export interface RespMechState {
  simTimeSeconds: number;
  /** Position within the current breath, 0..1 (0-0.4 inspiration, rest expiration) */
  breathPhaseFraction: number;
  /** Current lung volume above residual volume, mL */
  lungVolumeML: number;
  /** Progress through a forced vital capacity maneuver, 0..1; 0 means not running */
  fvcManeuverProgress: number;
  /** Whether an FVC maneuver is currently in progress */
  fvcManeuverActive: boolean;
  /** Smoothed hypoxic pulmonary vasoconstriction diversion, 0..1 */
  hpvDiversionLevel: number;
}

export interface RespMechDerived {
  /** Instantaneous lung volume above RV, mL, and airflow, mL/s (positive = expiratory) */
  lungVolumeML: number;
  airflowMLPerSec: number;
  breathPhaseFraction: number;
  /** Effective compliance after the surfactant penalty, mL/cmH2O */
  effectiveCompliance: number;
  /** The R × C time constant, seconds — governs how completely the lung empties each breath */
  timeConstantSeconds: number;
  /** Static lung volumes and capacities, mL */
  residualVolumeML: number;
  functionalResidualCapacityML: number;
  vitalCapacityML: number;
  totalLungCapacityML: number;
  /** Spirometry values derived from the forced maneuver */
  fvcML: number;
  fev1ML: number;
  fev1RatioPercent: number;
  peakExpiratoryFlowMLPerSec: number;
  spirometryPattern: SpirometryPattern;
  fvcManeuverActive: boolean;
  fvcManeuverProgress: number;
  /** Two-compartment V/Q model */
  ventilationUnitA: number;
  ventilationUnitB: number;
  perfusionUnitA: number;
  perfusionUnitB: number;
  vqRatioA: number;
  vqRatioB: number;
  hpvDiversionLevel: number;
  /** Alveolar ventilation, mL/min — what actually reaches gas-exchanging alveoli */
  alveolarVentilationMLPerMin: number;
  minuteVentilationMLPerMin: number;
  /** Work of breathing, J/min, and its two components — see `workOfBreathingJPerMin`. Normal
   * quiet breathing costs a few joules a minute; obstruction and stiff lungs each multiply it,
   * by different routes. */
  workOfBreathingJPerMin: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  respiratoryRate: number;
  tidalVolumeML: number;
  lungCompliance: number;
  airwayResistance: number;
  surfactantFunction: number;
  deadSpaceFraction: number;
  shuntFraction: number;
  hpvStrength: number;
}

export interface RespMechSnapshot {
  state: RespMechState;
  derived: RespMechDerived;
}

export interface RespMechHistoryPoint {
  t: number;
  lungVolume: number;
  airflow: number;
}
