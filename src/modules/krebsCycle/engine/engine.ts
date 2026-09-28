import { KREBS_CYCLE } from './constants';
import { approach, clamp } from '@/shared/lib/math';
import type {
  KrebsCycleDerived,
  KrebsCycleInputs,
  KrebsCycleInternalState,
  KrebsCycleSnapshot,
} from './types';

/** Reducing equivalents and carbon released by a number of cycle turns (Lehninger). */
export interface TcaYields {
  nadh: number;
  fadh2: number;
  gtp: number;
  co2: number;
}

export function yieldsOf(acetylCoAUnits: number): TcaYields {
  return {
    nadh: KREBS_CYCLE.NADH_PER_TURN * acetylCoAUnits,
    fadh2: KREBS_CYCLE.FADH2_PER_TURN * acetylCoAUnits,
    gtp: KREBS_CYCLE.GTP_PER_TURN * acetylCoAUnits,
    co2: KREBS_CYCLE.CO2_PER_TURN * acetylCoAUnits,
  };
}

/** TPP-dependent activity, 0.25-1: PDH and alpha-KGDH both need thiamine. */
export function thiamineFactor(inputs: KrebsCycleInputs): number {
  return KREBS_CYCLE.THIAMINE_FLOOR + (1 - KREBS_CYCLE.THIAMINE_FLOOR) * (inputs.thiaminePct / 100);
}

/** Fraction of oxygen available to accept electrons, 0-1. */
export function oxygenFactor(inputs: KrebsCycleInputs): number {
  return clamp(inputs.oxygenPct / 100, 0, 1);
}

/** Pyruvate -> acetyl-CoA through the PDH gate, baseline 1. */
export function pdhFluxOf(inputs: KrebsCycleInputs): number {
  return (
    (inputs.glucoseSupplyPct / 60) *
    inputs.pdhActivity *
    thiamineFactor(inputs) *
    (0.3 + 0.7 * oxygenFactor(inputs))
  );
}

/** Fatty-acid -> acetyl-CoA through beta-oxidation, baseline 1. */
export function fatFluxOf(inputs: KrebsCycleInputs): number {
  return (inputs.fattyAcidSupplyPct / 40) * (0.3 + 0.7 * oxygenFactor(inputs));
}

/** ADP/Ca2+ drive on the dehydrogenases, baseline 1 at rest. */
export function demandOf(inputs: KrebsCycleInputs): number {
  return clamp(inputs.atpDemandMet / 1.2, 0.4, 2.5);
}

/** NAD+ available to be reduced: without oxygen the chain cannot re-oxidise NADH. */
export function nadAvailabilityOf(inputs: KrebsCycleInputs): number {
  return 0.2 + 0.8 * oxygenFactor(inputs);
}

/**
 * Turns of the cycle per unit time, baseline 1. Demand pulls, substrates permit, oxygen and
 * thiamine gate — the multiplicative shape is the point: a single choked factor stalls the
 * whole throughput rather than shaving a percentage off it.
 */
export function tcaFluxOf(inputs: KrebsCycleInputs): number {
  const acetyl = pdhFluxOf(inputs) + fatFluxOf(inputs);
  const adequacy = clamp(acetyl / 2, 0, 1.3);
  return (
    demandOf(inputs) *
    nadAvailabilityOf(inputs) *
    (0.4 + 0.6 * adequacy) *
    (0.5 + 0.5 * thiamineFactor(inputs))
  );
}

/**
 * Plasma lactate, mmol/L. Pyruvate denied the PDH gate — blocked enzyme, missing cofactor,
 * or no oxygen to take the electrons — is reduced to lactate instead, plus the hypoxic
 * glycolytic drive itself.
 */
export function lactateOf(inputs: KrebsCycleInputs): number {
  const pyruvate = (inputs.glucoseSupplyPct / 60) * (0.5 + 0.5 * Math.min(demandOf(inputs), 2));
  const gate = inputs.pdhActivity * thiamineFactor(inputs) * (0.2 + 0.8 * oxygenFactor(inputs));
  return Math.max(
    0.3,
    KREBS_CYCLE.LACTATE_BASE_MMOL_L +
      KREBS_CYCLE.LACTATE_PER_BLOCKED_PYRUVATE * pyruvate * Math.max(0, 1 - gate) +
      KREBS_CYCLE.LACTATE_PER_HYPOXIA * (1 - oxygenFactor(inputs)) * pyruvate,
  );
}

/** Respiratory quotient from the fuel shares: carbohydrate 1.0, fat 0.7. */
export function rqOf(pdhFlux: number, fatFlux: number): number {
  const total = Math.max(pdhFlux + fatFlux, 1e-9);
  return clamp(
    (pdhFlux * KREBS_CYCLE.RQ_CARBOHYDRATE + fatFlux * KREBS_CYCLE.RQ_FAT) / total,
    0.67,
    1.05,
  );
}

/** The classification shown under the cycle diagram. */
export function krebsStateOf(inputs: KrebsCycleInputs, lactate: number): string {
  if (oxygenFactor(inputs) < 0.4) return 'Oxygen-limited';
  const cofactorPoor = thiamineFactor(inputs) < 0.6 || inputs.pdhActivity < 0.5;
  if (cofactorPoor && lactate > 2) return 'Cofactor-limited';
  if (demandOf(inputs) > 1.5) return 'High demand';
  const adequacy = clamp((pdhFluxOf(inputs) + fatFluxOf(inputs)) / 2, 0, 1.3);
  if (adequacy < 0.6) return 'Substrate-limited';
  return 'Aerobic balance';
}

export function createInitialState(): KrebsCycleInternalState {
  return {
    simTimeSeconds: 0,
    tcaFlux: 1,
    lactateMmolL: 0.8,
    atpYield: 12.5,
  };
}

export function computeDerived(state: KrebsCycleInternalState, inputs: KrebsCycleInputs): KrebsCycleDerived {
  const pdhFlux = pdhFluxOf(inputs);
  const fatFlux = fatFluxOf(inputs);
  const tca = state.tcaFlux;
  const yields = yieldsOf(tca);
  const nadh = yields.nadh + KREBS_CYCLE.PDH_NADH * pdhFlux;
  const atp =
    state.atpYield;
  const o2 = KREBS_CYCLE.RESTING_O2_ML_PER_MIN * clamp(nadh / 4, 0, 3);
  const rq = rqOf(pdhFlux, fatFlux);
  const lactate = state.lactateMmolL;
  return {
    pdhFlux,
    fatFlux,
    acetylCoA: pdhFlux + fatFlux,
    tcaFlux: tca,
    nadhRate: nadh,
    fadh2Rate: yields.fadh2,
    atpYield: atp,
    co2mLPerMin: o2 * rq,
    o2mLPerMin: o2,
    lactateMmolL: lactate,
    rqProxy: rq,
    krebsState: krebsStateOf(inputs, lactate),
  };
}

/** ATP target from the current flux: the chain cashing in the reducing equivalents. */
export function atpTargetOf(inputs: KrebsCycleInputs): number {
  const tca = tcaFluxOf(inputs);
  const yields = yieldsOf(tca);
  const nadh = yields.nadh + KREBS_CYCLE.PDH_NADH * pdhFluxOf(inputs);
  return nadh * KREBS_CYCLE.ATP_PER_NADH + yields.fadh2 * KREBS_CYCLE.ATP_PER_FADH2 + yields.gtp;
}

/** Smooth the readouts toward their targets — the pools turn over within seconds. */
export function tick(
  state: KrebsCycleInternalState,
  inputs: KrebsCycleInputs,
  dtSeconds: number,
): KrebsCycleInternalState {
  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    tcaFlux: approach(state.tcaFlux, tcaFluxOf(inputs), dtSeconds, KREBS_CYCLE.TAU_SECONDS),
    lactateMmolL: approach(state.lactateMmolL, lactateOf(inputs), dtSeconds, KREBS_CYCLE.TAU_SECONDS),
    atpYield: approach(state.atpYield, atpTargetOf(inputs), dtSeconds, KREBS_CYCLE.TAU_SECONDS),
  };
}

export function step(
  state: KrebsCycleInternalState,
  inputs: KrebsCycleInputs,
  dtSeconds: number,
): KrebsCycleSnapshot {
  const nextState = tick(state, inputs, dtSeconds);
  return { state: nextState, derived: computeDerived(nextState, inputs) };
}

/** `KrebsCycleSnapshot` re-exported so engine consumers can name it without re-importing types. */
export type { KrebsCycleSnapshot };
