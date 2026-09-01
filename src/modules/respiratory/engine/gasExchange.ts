import { GAS_EXCHANGE, VENTILATION } from './constants';
import { clamp } from '@/shared/lib/math';

export function effectiveMinuteVentilation(inputVentilationPct: number, chemoreceptorDrive: number): number {
  const gain =
    chemoreceptorDrive >= 0
      ? 1 + chemoreceptorDrive * VENTILATION.MAX_CHEMO_VENTILATION_GAIN
      : 1 + chemoreceptorDrive * VENTILATION.NEGATIVE_DRIVE_DAMPING;
  return clamp(
    inputVentilationPct * gain,
    inputVentilationPct * VENTILATION.MIN_VENTILATION_MULTIPLIER,
    inputVentilationPct * (1 + VENTILATION.MAX_CHEMO_VENTILATION_GAIN),
  );
}

export function alveolarVentilationFraction(
  effectiveVentilationPct: number,
  airwayObstruction: number,
  vqMismatch = 0,
): number {
  const obstructionMultiplier = 1 - airwayObstruction * VENTILATION.MAX_OBSTRUCTION_VENTILATION_REDUCTION;
  // Mismatch wastes some of each breath on alveoli that are ventilated but not perfused.
  const deadSpaceMultiplier = 1 - clamp(vqMismatch, 0, 1) * VENTILATION.MAX_VQ_DEAD_SPACE_FRACTION;
  return Math.max(
    GAS_EXCHANGE.VA_FLOOR_FRACTION,
    (effectiveVentilationPct / 100) * obstructionMultiplier * deadSpaceMultiplier,
  );
}

/** PaCO2 is proportional to CO2 production over alveolar ventilation (a normalized form
 * of PACO2 = 0.863 * VCO2 / VA). */
export function paCO2(co2ProductionPct: number, vaFraction: number): number {
  const raw = (GAS_EXCHANGE.BASELINE_PACO2_MMHG * (co2ProductionPct / 100)) / vaFraction;
  return clamp(raw, GAS_EXCHANGE.PACO2_MIN_MMHG, GAS_EXCHANGE.PACO2_MAX_MMHG);
}

/**
 * The A-a gradient, mmHg — how much oxygen is lost between alveolus and artery.
 *
 * Two contributors with very different weights. Bronchospasm mostly stops air arriving, which the
 * alveolar gas equation already accounts for; V/Q mismatch and shunt leave blood passing alveoli it
 * cannot equilibrate with, and that is what a gradient measures.
 */
export function aaGradient(airwayObstruction: number, vqMismatch = 0): number {
  return (
    GAS_EXCHANGE.AA_GRADIENT_BASELINE_MMHG +
    airwayObstruction * GAS_EXCHANGE.AA_GRADIENT_OBSTRUCTION_GAIN_MMHG +
    clamp(vqMismatch, 0, 1) * GAS_EXCHANGE.AA_GRADIENT_VQ_GAIN_MMHG
  );
}

/** Alveolar gas equation (PAO2 = FiO2*(Patm-PH2O) - PaCO2/RQ), minus the A-a gradient
 * to get arterial PaO2. */
export function paO2(fiO2: number, currentPaCO2: number, currentAaGradient: number): number {
  const alveolar =
    fiO2 * (GAS_EXCHANGE.ATM_PRESSURE_MMHG - GAS_EXCHANGE.H2O_VAPOR_PRESSURE_MMHG) -
    currentPaCO2 / GAS_EXCHANGE.RESPIRATORY_QUOTIENT;
  return clamp(alveolar - currentAaGradient, GAS_EXCHANGE.PAO2_MIN_MMHG, GAS_EXCHANGE.PAO2_MAX_MMHG);
}

/** Severinghaus (1979) approximation of the O2-hemoglobin dissociation curve (no pH/temperature
 * Bohr-effect correction — a deliberate simplification for this pass). */
export function saO2(currentPaO2: number): number {
  const p3 = currentPaO2 ** 3;
  const denom = 23400 / (p3 + 150 * currentPaO2) + 1;
  return clamp(100 / denom, 0, 100);
}
