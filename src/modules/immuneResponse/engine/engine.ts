import { ADAPTIVE, ANTIGEN_PRESENTATION, CYTOKINES, HUMORAL, IMMUNE_SIMULATION, INNATE, MEMORY, PATHOGEN, VACCINE } from './constants';
import {
  antigenPresentationTarget,
  bCellTarget,
  cytotoxicTTarget,
  effectorKilling,
  helperTTarget,
  iggTarget,
  igmTarget,
  memorySpeedup,
  memoryTarget,
  suppressionFactor,
} from './adaptiveResponse';
import { approach, clamp } from '@/shared/lib/math';

/**
 * Relaxation with different rise and fall time constants.
 *
 * Immune populations expand fast and contract slowly, and modelling that asymmetry is
 * essential rather than cosmetic: with a symmetric constant the response collapses the instant
 * antigen falls, the pathogen rebounds, and the whole system oscillates indefinitely instead
 * of resolving. It is also simply true — circulating IgG has a half-life of about three weeks.
 */
function approachAsymmetric(current: number, target: number, dtDays: number, riseTauDays: number, fallTauDays: number): number {
  return approach(current, target, dtDays, target >= current ? riseTauDays : fallTauDays);
}
import type { ImmuneDerived, ImmuneInputs, ImmuneSnapshot, ImmuneState, ResponsePhase } from './types';

export function createInitialState(): ImmuneState {
  return {
    simTimeSeconds: 0,
    pathogenLoad: 0,
    innateActivity: 0,
    antigenPresentation: 0,
    helperTActivity: 0,
    cytotoxicTActivity: 0,
    bCellActivity: 0,
    igmTitre: 0,
    iggTitre: 0,
    memoryLevel: 0,
    cytokineLevel: 0,
    vaccineAntigen: 0,
    daysSinceChallenge: -1,
    clearanceTimeDays: 0,
    peakPathogenLoad: 0,
  };
}

/** Names the stage of the response, following the biology rather than the clock. */
export function responsePhase(state: ImmuneState): ResponsePhase {
  const infected = state.pathogenLoad > PATHOGEN.CLEARED_THRESHOLD;
  if (!infected) {
    if (state.memoryLevel > 0.1) return 'memory';
    return 'naive';
  }
  if (state.helperTActivity > 0.25) return 'effector';
  if (state.antigenPresentation > 0.15) return 'priming';
  if (state.innateActivity > 0.1) return 'innate';
  return 'naive';
}

export function computeDerived(state: ImmuneState, inputs: ImmuneInputs): ImmuneDerived {
  const killing = effectorKilling(
    state.innateActivity,
    state.cytotoxicTActivity,
    state.igmTitre,
    state.iggTitre,
    inputs.pathogenType,
    inputs,
  );

  const cleared = state.daysSinceChallenge >= 0 && state.pathogenLoad <= PATHOGEN.CLEARED_THRESHOLD;

  return {
    pathogenLoad: state.pathogenLoad,
    innateActivity: state.innateActivity,
    antigenPresentation: state.antigenPresentation,
    helperTActivity: state.helperTActivity,
    cytotoxicTActivity: state.cytotoxicTActivity,
    bCellActivity: state.bCellActivity,
    igmTitre: state.igmTitre,
    iggTitre: state.iggTitre,
    memoryLevel: state.memoryLevel,
    temperatureC: CYTOKINES.NORMAL_TEMPERATURE_C + state.cytokineLevel * CYTOKINES.MAX_FEVER_RISE_C,
    responsePhase: responsePhase(state),
    clearanceTimeDays: state.clearanceTimeDays,
    peakPathogenLoad: state.peakPathogenLoad,
    daysSinceChallenge: state.daysSinceChallenge,
    totalEffectorActivity: killing,
    isCleared: cleared,
    pathogenVirulence: inputs.pathogenVirulence,
    pathogenType: inputs.pathogenType,
    innateImmuneFunction: inputs.innateImmuneFunction,
    helperTCellCount: inputs.helperTCellCount,
    bCellFunction: inputs.bCellFunction,
    immunosuppression: inputs.immunosuppression,
  };
}

export function tick(state: ImmuneState, derived: ImmuneDerived, dtSeconds: number): ImmuneState {
  // The engine works in DAYS; the loop supplies seconds.
  const dtDays = dtSeconds * IMMUNE_SIMULATION.DAYS_PER_SECOND;
  const suppression = suppressionFactor(derived.immunosuppression);

  // Pathogen dynamics: exponential replication against the current killing pressure.
  const replication = (derived.pathogenVirulence / 100) * PATHOGEN.BASE_REPLICATION_PER_DAY;
  const netGrowth = state.pathogenLoad * (replication - derived.totalEffectorActivity);
  const grown = clamp(state.pathogenLoad + netGrowth * dtDays, 0, PATHOGEN.MAX_LOAD);
  // Sterilising clearance: once the burden falls below the threshold the last organisms are
  // eliminated outright. Without this the exponential term can never quite reach zero, leaving
  // a reservoir that regrows the moment the response contracts.
  const pathogenLoad = grown <= PATHOGEN.CLEARED_THRESHOLD ? 0 : grown;

  // Memory shortens the adaptive delay — the whole point of prior exposure.
  const speedup = memorySpeedup(state.memoryLevel);

  const innateActivity = approach(
    state.innateActivity,
    clamp(state.pathogenLoad * INNATE.KILLING_GAIN * clamp(derived.innateImmuneFunction, 0, 1.5) * suppression, 0, 1),
    dtDays,
    INNATE.ACTIVATION_TAU_DAYS,
  );

  const vaccineAntigen = approach(state.vaccineAntigen, 0, dtDays, VACCINE.TAU_DAYS);

  const antigenPresentation = approachAsymmetric(
    state.antigenPresentation,
    antigenPresentationTarget(state.pathogenLoad, state.vaccineAntigen, suppression),
    dtDays,
    ANTIGEN_PRESENTATION.TAU_DAYS / speedup,
    ANTIGEN_PRESENTATION.FALL_TAU_DAYS,
  );

  const helperTActivity = approachAsymmetric(
    state.helperTActivity,
    helperTTarget(antigenPresentation, derived.helperTCellCount, suppression, state.memoryLevel),
    dtDays,
    ADAPTIVE.HELPER_TAU_DAYS / speedup,
    ADAPTIVE.HELPER_FALL_TAU_DAYS,
  );

  const cytotoxicTActivity = approachAsymmetric(
    state.cytotoxicTActivity,
    cytotoxicTTarget(helperTActivity, suppression),
    dtDays,
    ADAPTIVE.CYTOTOXIC_TAU_DAYS / speedup,
    ADAPTIVE.CYTOTOXIC_FALL_TAU_DAYS,
  );

  const bCellActivity = approachAsymmetric(
    state.bCellActivity,
    bCellTarget(antigenPresentation, helperTActivity, derived.bCellFunction, suppression, state.memoryLevel),
    dtDays,
    ADAPTIVE.B_CELL_TAU_DAYS / speedup,
    ADAPTIVE.B_CELL_FALL_TAU_DAYS,
  );

  const igmTitre = approachAsymmetric(
    state.igmTitre,
    igmTarget(bCellActivity),
    dtDays,
    HUMORAL.IGM_TAU_DAYS / speedup,
    HUMORAL.IGM_FALL_TAU_DAYS,
  );
  const iggTitre = approachAsymmetric(
    state.iggTitre,
    iggTarget(bCellActivity, helperTActivity, state.memoryLevel),
    dtDays,
    HUMORAL.IGG_TAU_DAYS / speedup,
    HUMORAL.IGG_FALL_TAU_DAYS,
  );

  // Memory forms during the response and then persists — the state that makes a re-challenge
  // behave completely differently.
  const memoryLevel = approach(
    state.memoryLevel,
    memoryTarget(bCellActivity, helperTActivity, state.memoryLevel),
    dtDays,
    MEMORY.FORMATION_TAU_DAYS,
  );

  const cytokineTarget = clamp(
    state.innateActivity * CYTOKINES.INNATE_WEIGHT + state.pathogenLoad * CYTOKINES.PATHOGEN_WEIGHT,
    0,
    1,
  );
  const cytokineLevel = approach(state.cytokineLevel, cytokineTarget, dtDays, CYTOKINES.TAU_DAYS);

  // Track the course of the current challenge.
  const challengeRunning = state.daysSinceChallenge >= 0;
  const daysSinceChallenge = challengeRunning ? state.daysSinceChallenge + dtDays : -1;
  const peakPathogenLoad = Math.max(state.peakPathogenLoad, pathogenLoad);
  const justCleared = challengeRunning && state.clearanceTimeDays === 0 && pathogenLoad <= PATHOGEN.CLEARED_THRESHOLD;
  const clearanceTimeDays = justCleared ? daysSinceChallenge : state.clearanceTimeDays;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    pathogenLoad,
    innateActivity,
    antigenPresentation,
    helperTActivity,
    cytotoxicTActivity,
    bCellActivity,
    igmTitre,
    iggTitre,
    memoryLevel,
    cytokineLevel,
    vaccineAntigen,
    daysSinceChallenge,
    clearanceTimeDays,
    peakPathogenLoad,
  };
}

export function step(state: ImmuneState, inputs: ImmuneInputs, dtSeconds: number): ImmuneSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** "Infect" — introduce a live pathogen and start the clock. */
export function perturbInfect(state: ImmuneState): ImmuneState {
  return {
    ...state,
    pathogenLoad: PATHOGEN.INITIAL_INOCULUM,
    daysSinceChallenge: 0,
    clearanceTimeDays: 0,
    peakPathogenLoad: PATHOGEN.INITIAL_INOCULUM,
  };
}

/**
 * "Vaccinate" — present antigen WITHOUT a replicating pathogen.
 *
 * This is the whole principle: the adaptive response is primed and memory forms, but nothing
 * ever replicates, so there is no illness. The memory it leaves behind is identical in kind to
 * the memory left by surviving the infection.
 */
export function perturbVaccinate(state: ImmuneState): ImmuneState {
  return {
    ...state,
    // Antigen that persists for days but never replicates.
    vaccineAntigen: clamp(state.vaccineAntigen + VACCINE.DOSE, 0, 1),
    pathogenLoad: 0,
  };
}
