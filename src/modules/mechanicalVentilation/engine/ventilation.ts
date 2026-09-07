import { MV_PHYSIOLOGY, MV_VENTILATOR } from './constants';
import type { MvInputs } from './types';
import { supportPressureCmH2O } from './pressures';

/** CPAP splint: an EPAP between 2 and 10 cmH2O progressively splints a collapsible airway,
 * recovering the patient's own tidal volume. Ineffective where nothing is collapsible. */
export function cpapSplintLevel(inputs: MvInputs, peepCmH2O: number): number {
  if (inputs.upperAirwayCollapse <= 0) return 0;
  const peeled = peepCmH2O - MV_VENTILATOR.CPAP_SPLINT_THRESHOLD_CMH2O;
  const splint = Math.max(0, Math.min(peeled / MV_VENTILATOR.CPAP_SPLINT_RANGE_CMH2O, 1));
  return inputs.upperAirwayCollapse * splint;
}

/** Tidal volume the virus delivers: the patient's own splinted breath, or the pressure support
 * (minus NIV mask leak), whichever is larger. Invasive ventilation is a pure pressure breath. */
export function tidalVolumeML(inputs: MvInputs, peepCmH2O: number): number {
  const own = inputs.nativeTidalVolumeML * inputs.nativeDrive;
  let ownEffective = own;
  let supported: number;
  if (inputs.mode === 'cpap') {
    ownEffective = own * (1 + cpapSplintLevel(inputs, peepCmH2O));
    return Math.max(ownEffective, 0);
  }
  const support = supportPressureCmH2O(inputs.mode, inputs.ipapPipCmH2O, peepCmH2O);
  supported = support * inputs.complianceMLPerCmH2O;
  if (inputs.mode === 'niv') supported *= MV_VENTILATOR.NIV_LEAK_EFFICIENCY;
  return Math.max(ownEffective, supported);
}

/** Who sets the rate: the ventilator alone in invasive ventilation (the patient is paralysed or
 * overwhelmed); outside it, the patient's own drive unless it falls below the back-up rate. */
export function effectiveRatePerMin(inputs: MvInputs): number {
  if (inputs.mode === 'invasive') return inputs.ventRatePerMin;
  return Math.max(inputs.nativeRatePerMin, inputs.ventRatePerMin);
}

/** Fraction of the expiratory time the emptying completes. Long time-constants (COPD) or short
 * expiratory times (fast rates) mean the next breath starts before the last finished — trapping. */
export function airTrapping(inputs: MvInputs, ratePerMin: number): number {
  const timeConstantSeconds =
    inputs.airwayResistanceCmH2OPerLPerSec *
    inputs.complianceMLPerCmH2O *
    MV_VENTILATOR.RESISTANCE_TO_TC_S;
  const cycleSeconds = 60 / Math.max(ratePerMin, 1);
  const expiratorySeconds = cycleSeconds * (1 - MV_PHYSIOLOGY.INSPIRATORY_FRACTION);
  const emptied = Math.max(0, Math.min(expiratorySeconds / (MV_VENTILATOR.EMPTY_AT_TC * timeConstantSeconds), 1));
  return 1 - emptied;
}

export function intrinsicAutoPeepCmH2O(
  inputs: MvInputs,
  trapping: number,
): number {
  return (
    inputs.intrinsicPeepCmH2O +
    trapping * inputs.airwayResistanceCmH2OPerLPerSec * MV_VENTILATOR.TRAPPED_PEEP_GAIN_CMH2O
  );
}

/** Any gas trapped at end-expiration is dead space on top of the anatomical — the hypercapnia
 * of a lung that cannot empty. */
export function effectiveDeadSpaceFraction(inputs: MvInputs, trapping: number): number {
  const added = trapping * MV_VENTILATOR.TRAPPED_DEADSPACE_GAIN;
  return Math.min(inputs.deadSpaceFraction + added, MV_VENTILATOR.MAX_DEAD_SPACE_FRACTION);
}

export function alveolarVentilationMLPerMin(
  tidalVolumeML: number,
  effectiveDeadSpaceFraction: number,
  ratePerMin: number,
): number {
  return tidalVolumeML * (1 - effectiveDeadSpaceFraction) * ratePerMin;
}

/** The patient's own ventilatory effort as a share of unsupported work — a pressure support
 * breath carries the load towards zero as the support approaches the full ceiling (10 cmH2O). */
export function wobEffortPct(inputs: MvInputs, peepCmH2O: number): number {
  const support = supportPressureCmH2O(inputs.mode, inputs.ipapPipCmH2O, peepCmH2O);
  const carried = Math.min(support / MV_PHYSIOLOGY.SUPPORT_WOB_CEILING_CMH2O, 1);
  const effort = inputs.nativeDrive * (1 - carried);
  return Math.round(Math.max(0, Math.min(effort, 1)) * 100);
}