import { MV_INTERPRETATION, MV_PHYSIOLOGY, MV_VENTILATOR } from './constants';
import type { MvInputs } from './types';

/** Pressure support in effect: IPAP-PEP for CPAP/NIV vs PIP-PEEP for invasive. */
export function supportPressureCmH2O(mode: MvInputs['mode'], ipapPipCmH2O: number, peepCmH2O: number): number {
  if (mode === 'cpap') return 0;
  return Math.max(0, ipapPipCmH2O - peepCmH2O);
}

export function inspiratoryPressureCmH2O(mode: MvInputs['mode'], ipapPipCmH2O: number, peepCmH2O: number): number {
  if (mode === 'cpap') return peepCmH2O;
  return Math.max(ipapPipCmH2O, peepCmH2O);
}

/** Driving pressure — the stretch of each breath — is the inspiratory-to-PEEP gap on the dial. */
export function drivingPressureCmH2O(mode: MvInputs['mode'], inspiratoryCmH2O: number, peepCmH2O: number): number {
  if (mode === 'cpap') return 0;
  return Math.max(0, inspiratoryCmH2O - peepCmH2O);
}

/** The resistive drop the flow takes across the airways: high resistance (COPD) eats part of
 * the set peak so the plateau — the alveolar pressure that does the stretching — sits lower. */
export function resistivePressureDropCmH2O(flowLPerSec: number, resistanceCmH2OPerLPerSec: number): number {
  const drop = flowLPerSec * resistanceCmH2OPerLPerSec;
  return Math.max(0, Math.min(drop, MV_INTERPRETATION.RESISTIVE_PRESSURE_CEILING_CMH2O));
}

/** Peak airway pressure = inspiratory support + whatever the resistance eats during flow. */
export function peakPressureCmH2O(
  inspiratoryCmH2O: number,
  resistiveDropCmH2O: number,
): number {
  return inspiratoryCmH2O + Math.max(0, resistiveDropCmH2O);
}

export function meanAirwayPressureCmH2O(totalPeepCmH2O: number, inspiratoryCmH2O: number): number {
  return totalPeepCmH2O + (inspiratoryCmH2O - totalPeepCmH2O) * MV_PHYSIOLOGY.INSPIRATORY_FRACTION;
}

/** Mean inspiratory flow, L/s, from the delivered tidal volume and the inspiratory time. */
export function meanInspiratoryFlowLPerSec(tidalVolumeML: number, ratePerMin: number): number {
  const cycleSeconds = 60 / Math.max(ratePerMin, 1);
  const inspiratorySeconds = Math.max(cycleSeconds * MV_PHYSIOLOGY.INSPIRATORY_FRACTION, 0.1);
  return (tidalVolumeML / 1000) / inspiratorySeconds;
}

/** Instantaneous airway pressure across the breath cycle, dimensionless phase 0..1:
 * a rounded inspiration (0..0.4) then an exponential return to PEEP. CPAP, with no support
 * pressure, draws a flat line at EPAP. */
export function airwayPressureAtPhase(
  phase: number,
  peepCmH2O: number,
  inspiratoryCmH2O: number,
): number {
  const plateau = Math.max(0, inspiratoryCmH2O - peepCmH2O);
  if (plateau <= 0.01) return peepCmH2O;
  if (phase <= MV_PHYSIOLOGY.INSPIRATORY_FRACTION) {
    const k = phase / MV_PHYSIOLOGY.INSPIRATORY_FRACTION;
    return peepCmH2O + plateau * Math.sin((k * Math.PI) / 2);
  }
  const exhaled = (phase - MV_PHYSIOLOGY.INSPIRATORY_FRACTION) / (1 - MV_PHYSIOLOGY.INSPIRATORY_FRACTION);
  // ~5.5 time-constants across expiration returns the airway to PEEP almost fully by the next
  // breath; a gentler decay would show the previous breath bleeding into the next on the monitor.
  return peepCmH2O + plateau * Math.exp(-5.5 * exhaled);
}

export const TRAPPING_FRAME = MV_VENTILATOR.EMPTY_AT_TC;