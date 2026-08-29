import { KINETICS } from './constants';
import { apparentKmMm, apparentVmax, phFactor, rateAt, temperatureFactor } from './kinetics';
import { approach, clamp } from '@/shared/lib/math';
import type {
  KineticsDerived,
  KineticsHistoryPoint,
  KineticsInputs,
  KineticsInternalState,
  KineticsSnapshot,
} from './types';

export function createInitialState(): KineticsInternalState {
  return {
    simTimeSeconds: 0,
    observedRateUmPerMin: 0,
  };
}

export function computeDerived(state: KineticsInternalState, inputs: KineticsInputs): KineticsDerived {
  const km = apparentKmMm(inputs.kmMm, inputs.inhibitorType, inputs.inhibitorUm, inputs.kiUm);
  const vmax = apparentVmax(inputs.vmaxUmPerMin, inputs.inhibitorType, inputs.inhibitorUm, inputs.kiUm);

  const tFactor = temperatureFactor(inputs.temperatureC);
  const pFactor = phFactor(inputs.ph);
  const effectiveVmax = vmax * tFactor * pFactor;
  const rate = rateAt(inputs.substrateMm, effectiveVmax, km);
  const referenceRate = Math.max(rateAt(inputs.substrateMm, inputs.vmaxUmPerMin, inputs.kmMm), 1e-9);

  return {
    reactionRateUmPerMin: state.observedRateUmPerMin,
    apparentVmaxUmPerMin: effectiveVmax,
    apparentKmMm: km,
    saturationPct: clamp((inputs.substrateMm / (Math.max(km, 1e-6) + inputs.substrateMm)) * 100, 0, 100),
    residualActivityPct: clamp((rate / referenceRate) * 100, 0, 100),
    temperatureFactor: tFactor,
    phFactor: pFactor,
    inhibitorType: inputs.inhibitorType,
    substrateMm: inputs.substrateMm,
    vmaxUmPerMin: inputs.vmaxUmPerMin,
    kmMm: inputs.kmMm,
    temperatureC: inputs.temperatureC,
    ph: inputs.ph,
  };
}

export function tick(state: KineticsInternalState, derived: KineticsDerived, dtSeconds: number): KineticsInternalState {
  // The needle follows the algebra: apparent Vmax scaled by current fractional saturation
  // is precisely the Michaelis-Menten velocity at this instant.
  const targetRate = (derived.apparentVmaxUmPerMin * derived.saturationPct) / 100;
  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    observedRateUmPerMin: approach(state.observedRateUmPerMin, clamp(targetRate, 0, 10000), dtSeconds, KINETICS.RATE_TAU_SECONDS),
  };
}

export function step(state: KineticsInternalState, inputs: KineticsInputs, dtSeconds: number): KineticsSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

export type { KineticsHistoryPoint };