import { ISCHAEMIA, STENOSIS } from './constants';
import { clamp } from '@/shared/lib/math';
import type { CoronaryState_Classification } from './types';

/** Fractional shortfall of oxygen supply against demand, 0-1. */
export function supplyGap(requiredFlow: number, maximalCapacity: number): number {
  const demand = Math.max(requiredFlow, 1e-6);
  return clamp((requiredFlow - Math.max(maximalCapacity, 0)) / demand, 0, 1);
}

/** Contractility actually available: ischaemic muscle contracts weakly, which lowers demand and
 * (through the systemic circulation this module deliberately does not model) pressure too. */
export function contractilityPenalty(ischaemiaLevel: number): number {
  return 1 - ISCHAEMIA.CONTRACTILITY_GAIN * clamp(ischaemiaLevel, 0, 1);
}

export function isTransmural(effectiveNarrowing: number, maximalCapacity: number, requiredFlow: number): boolean {
  return (
    effectiveNarrowing >= STENOSIS.TRANSMURAL_SEVERITY &&
    maximalCapacity < STENOSIS.TRANSMURAL_FLOW_FRACTION * Math.max(requiredFlow, 1e-6)
  );
}

/** Necrosis accumulates only while transmural injury persists, and heals at a glacial rate —
 * myocardium does not grow back on the timescale of this simulation either. */
export function updateNecrosis(current: number, transmuralActive: boolean, dtSeconds: number): number {
  const next = transmuralActive
    ? current + ISCHAEMIA.NECROSIS_ACCUM_PER_SECOND * dtSeconds
    : current - ISCHAEMIA.NECROSIS_HEAL_PER_SECOND * dtSeconds;
  return clamp(next, 0, 1);
}

export function classify(params: {
  necrosisLoad: number;
  transmuralActive: boolean;
  ischaemiaLevel: number;
}): CoronaryState_Classification {
  if (params.necrosisLoad >= ISCHAEMIA.CLASSIFY_MIN_LOAD) return 'established infarct';
  if (params.transmuralActive) return 'transmural injury';
  if (params.ischaemiaLevel >= ISCHAEMIA.GAP_ONSET) return 'subendocardial ischaemia';
  return 'balanced';
}

export function patternSummary(params: {
  classification: CoronaryState_Classification;
  flowReserveRatio: number;
  drivingPressureMmHg: number;
  oxygenCarriageRatio: number;
  diastolicTimeFraction: number;
}): string {
  switch (params.classification) {
    case 'balanced':
      if (params.flowReserveRatio < 2) {
        return 'flow meets demand now, but the reserve is spent — exertion will decide it';
      }
      return 'flow meets demand with vasodilatory reserve to spare';
    case 'subendocardial ischaemia':
      if (params.oxygenCarriageRatio < 0.75) return 'open arteries cannot deliver what thin blood does not carry';
      if (params.drivingPressureMmHg < 30) return 'the perfusion head itself has fallen — a supply problem';
      if (params.diastolicTimeFraction < 0.6) return 'the cycle leaves too little diastole to perfuse through';
      return 'demand has outrun a limited supply — the inner wall starves first';
    case 'transmural injury':
      return 'a vessel is occluded — the full territory is at risk';
    case 'established infarct':
      return 'necrosis has accumulated; restoring flow now salvages little';
  }
}
