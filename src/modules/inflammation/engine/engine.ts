import { ACUTE, SIMULATION, SYSTEMIC } from './constants';
import {
  chronicTarget,
  granulomaTarget,
  mediatorTarget,
  monocyteTarget,
  neutrophilTarget,
  pusDrainPerDay,
  pusPerDay,
} from './acutePhase';
import { antibioticKillPerDay, depositedLoad, immuneKillPerDay, insultGrowthPerDay, sourceControlRemovalPerDay } from './insult';
import { coreTemperatureC, crpTargetMgL, cytokineTarget, feverOffsetC, sirsActive } from './systemicResponse';
import { approach, clamp } from '@/shared/lib/math';
import type {
  InflammationDerived,
  InflammationHistoryPoint,
  InflammationInputs,
  InflammationInternalState,
  InflammationSnapshot,
  InflammationState_Classification,
} from './types';

export function createInitialState(): InflammationInternalState {
  return {
    simTimeSeconds: 0,
    insultLoad: 0,
    mediatorLevel: 0,
    neutrophilPopulation: 0.12,
    monocyteMacrophageActivity: 0.06,
    pusBurden: 0,
    tissueDamage: 0,
    persistenceSeconds: 0,
    chronicInflammationIndex: 0,
    granulomaLoad: 0,
    systemicCytokineLevel: 0,
    crpMgL: 3,
  };
}

export function computeDerived(state: InflammationInternalState, inputs: InflammationInputs): InflammationDerived {
  const vasodilation = clamp(state.mediatorLevel * 0.9 + state.chronicInflammationIndex * 0.25, 0, 1);
  const permeability = clamp(state.mediatorLevel * 1.05 + state.pusBurden * 0.3, 0, 1);
  const painProxy = clamp(state.mediatorLevel * 0.8 + state.pusBurden * 0.45 + state.tissueDamage * 0.35, 0, 1);

  const innateFraction = clamp(inputs.innateImmuneFunctionPct / 100, 0, 1);
  // The circulating count: a recruited population riding on a baseline that itself depends
  // on marrow supply — which is why neutropenia can hide an infection's usual signature.
  const neutrophilCount =
    ACUTE.NEUTROPHIL_BASELINE_10E9 * (0.15 + 0.85 * innateFraction) +
    state.neutrophilPopulation * (ACUTE.NEUTROPHIL_MAX_10E9 - ACUTE.NEUTROPHIL_BASELINE_10E9);

  const classification = classify({
    insultLoad: state.insultLoad,
    neutrophilPopulation: state.neutrophilPopulation,
    monocyteMacrophageActivity: state.monocyteMacrophageActivity,
    mediatorLevel: state.mediatorLevel,
    pusBurden: state.pusBurden,
    chronicInflammationIndex: state.chronicInflammationIndex,
    granulomaLoad: state.granulomaLoad,
    systemicCytokineLevel: state.systemicCytokineLevel,
    innateImmuneFunctionPct: inputs.innateImmuneFunctionPct,
    steroidDosePct: inputs.steroidDosePct,
  });

  return {
    mediatorLevel: state.mediatorLevel,
    vasodilationIndex: vasodilation,
    permeabilityIndex: permeability,
    painProxyIndex: painProxy,

    neutrophilCount10e9PerL: clamp(neutrophilCount, 0, ACUTE.NEUTROPHIL_MAX_10E9),
    neutrophilPopulation: state.neutrophilPopulation,
    monocyteMacrophageActivity: state.monocyteMacrophageActivity,
    pusBurden: state.pusBurden,
    tissueDamage: state.tissueDamage,

    chronicInflammationIndex: state.chronicInflammationIndex,
    granulomaLoad: state.granulomaLoad,

    systemicCytokineLevel: state.systemicCytokineLevel,
    crpMgL: state.crpMgL,
    coreTemperatureC: coreTemperatureC(feverOffsetC(state.systemicCytokineLevel)),
    sirsActive: sirsActive(state.systemicCytokineLevel),

    insultLoad: state.insultLoad,

    classification,
    patternSummary: patternSummary(classification),

    insultSeverityPct: inputs.insultSeverityPct,
    insultType: inputs.insultType,
    antibioticEfficacyPct: inputs.antibioticEfficacyPct,
    steroidDosePct: inputs.steroidDosePct,
    innateImmuneFunctionPct: inputs.innateImmuneFunctionPct,
    sourceControlPct: inputs.sourceControlPct,
  };
}

function classify(params: {
  insultLoad: number;
  neutrophilPopulation: number;
  monocyteMacrophageActivity: number;
  mediatorLevel: number;
  pusBurden: number;
  chronicInflammationIndex: number;
  granulomaLoad: number;
  systemicCytokineLevel: number;
  innateImmuneFunctionPct: number;
  steroidDosePct: number;
}): InflammationState_Classification {
  if (params.granulomaLoad > 0.25 && params.chronicInflammationIndex > 0.35) {
    return 'granulomatous inflammation';
  }
  if (
    params.steroidDosePct >= 40 &&
    params.insultLoad > 0.4 &&
    params.neutrophilPopulation < 0.5
  ) {
    return 'smouldering under immunosuppression';
  }
  if (params.pusBurden > ACUTE.ABSCESS_PUS_THRESHOLD) {
    return 'abscess formation';
  }
  if (sirsActive(params.systemicCytokineLevel)) return 'systemic inflammatory response';
  if (params.chronicInflammationIndex > 0.35 && params.insultLoad > 0.08) return 'chronic inflammation';
  if (
    params.insultLoad > 0.04 &&
    params.monocyteMacrophageActivity > params.neutrophilPopulation * 0.9 &&
    params.mediatorLevel < 0.55
  ) {
    return 'acute inflammation (resolving)';
  }
  if (params.insultLoad > 0.04 || params.pusBurden > 0.05) return 'acute inflammation';
  return 'quiescent';
}

function patternSummary(classification: InflammationState_Classification): string {
  switch (classification) {
    case 'quiescent':
      return 'no active response — surveillance only';
    case 'acute inflammation':
      return 'mediators first, neutrophils pouring in — rubor, calor, tumor, dolor';
    case 'acute inflammation (resolving)':
      return 'macrophages are winning; the wave is receding behind them';
    case 'abscess formation':
      return 'dead neutrophils have collected — nothing systemic reaches the middle of pus';
    case 'chronic inflammation':
      return 'the acute arm failed to clear it; macrophages and lymphocytes take over the siege';
    case 'granulomatous inflammation':
      return 'organised containment around something nothing can degrade';
    case 'smouldering under immunosuppression':
      return 'the response is blunted but so is the killing — the load grows quietly';
    case 'systemic inflammatory response':
      return "one tissue's war is now everyone's — fever, CRP, and the rest of the body paying";
  }
}

export function tick(
  state: InflammationInternalState,
  inputs: InflammationInputs,
  dtSeconds: number,
): InflammationInternalState {
  const dtDays = dtSeconds / 86400;

  // The load itself: growth minus immune killing, antibiotic kill and source control.
  const netInsultPerDay =
    insultGrowthPerDay(inputs.insultType, state.insultLoad) -
    immuneKillPerDay(state.neutrophilPopulation, state.monocyteMacrophageActivity, inputs.innateImmuneFunctionPct, inputs.insultType) -
    antibioticKillPerDay(inputs.antibioticEfficacyPct, inputs.insultType) * clamp(state.insultLoad, 0, 2) -
    sourceControlRemovalPerDay(inputs.sourceControlPct) * clamp(state.insultLoad, 0, 2);

  const projectedInsult = clamp(state.insultLoad + netInsultPerDay * dtDays, 0, 2.4);

  // Persistence clock: reset when nothing is left to fight.
  const persistenceSeconds = projectedInsult > 0.05 ? state.persistenceSeconds + dtSeconds : 0;

  const nextMediators = approach(
    state.mediatorLevel,
    mediatorTarget(projectedInsult, inputs.steroidDosePct),
    dtSeconds,
    ACUTE.MEDIATOR_TAU_SECONDS,
  );

  const chronicNext = approach(
    state.chronicInflammationIndex,
    chronicTarget(persistenceSeconds, projectedInsult, state.monocyteMacrophageActivity),
    dtSeconds,
    ACUTE.CHRONIC_TAU_SECONDS,
  );

  const nextCytokines = approach(
    state.systemicCytokineLevel,
    cytokineTarget({
      mediatorLevel: nextMediators,
      neutrophilPopulation: state.neutrophilPopulation,
      pusBurden: state.pusBurden,
      chronicInflammationIndex: chronicNext,
      steroidDosePct: inputs.steroidDosePct,
    }),
    dtSeconds,
    SYSTEMIC.CYTOKINE_TAU_SECONDS,
  );

  const nextNeutrophils = approach(
    state.neutrophilPopulation,
    neutrophilTarget({
      mediatorLevel: nextMediators,
      systemicCytokineLevel: nextCytokines,
      innateImmuneFunctionPct: inputs.innateImmuneFunctionPct,
      steroidDosePct: inputs.steroidDosePct,
    }),
    dtSeconds,
    ACUTE.NEUTROPHIL_TAU_SECONDS,
  );

  const nextMonocytes = approach(
    state.monocyteMacrophageActivity,
    monocyteTarget({
      mediatorLevel: nextMediators,
      insultLoad: projectedInsult,
      chronicInflammationIndex: chronicNext,
      innateImmuneFunctionPct: inputs.innateImmuneFunctionPct,
    }),
    dtSeconds,
    ACUTE.MONOCYTE_TAU_SECONDS,
  );

  const nextPus = clamp(
    state.pusBurden + (pusPerDay(nextNeutrophils, projectedInsult) - pusDrainPerDay(state.pusBurden, inputs.sourceControlPct)) * dtDays,
    0,
    2,
  );

  const damageDelta =
    (ACUTE.DAMAGE_RATE_PER_DAY * clamp(nextNeutrophils, 0, 2) * clamp(projectedInsult + state.pusBurden, 0, 1.5) +
      ACUTE.DAMAGE_RATE_PER_DAY * 0.6 * chronicNext) *
      dtDays -
    (projectedInsult < 0.05 ? ACUTE.DAMAGE_HEAL_PER_DAY : 0) * dtDays;

  const nextGranuloma = approach(
    state.granulomaLoad,
    granulomaTarget(chronicNext, projectedInsult),
    dtSeconds,
    ACUTE.GRANULOMA_TAU_SECONDS,
  );

  const nextCrp = approach(state.crpMgL, crpTargetMgL(nextCytokines), dtSeconds, SYSTEMIC.CRP_TAU_SECONDS);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    insultLoad: projectedInsult,
    mediatorLevel: nextMediators,
    neutrophilPopulation: nextNeutrophils,
    monocyteMacrophageActivity: nextMonocytes,
    pusBurden: nextPus,
    tissueDamage: clamp(state.tissueDamage + damageDelta, 0, 1.5),
    persistenceSeconds,
    chronicInflammationIndex: chronicNext,
    granulomaLoad: nextGranuloma,
    systemicCytokineLevel: nextCytokines,
    crpMgL: nextCrp,
  };
}

export function step(state: InflammationInternalState, inputs: InflammationInputs, dtSeconds: number): InflammationSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, inputs, dtSeconds), derived };
}

/** A fresh challenge lands in previously quiet tissue, sized by the severity setting. */
export function perturbNewInsult(state: InflammationInternalState, insultSeverityPct = 50): InflammationInternalState {
  return {
    ...state,
    insultLoad: clamp(state.insultLoad + depositedLoad(insultSeverityPct), 0, 2.4),
    persistenceSeconds: 0,
  };
}

/** Incision and drainage: the collection is emptied mechanically. */
export function perturbDrainAbscess(state: InflammationInternalState, fraction = 0.8): InflammationInternalState {
  return { ...state, pusBurden: state.pusBurden * (1 - clamp(fraction, 0, 1)), insultLoad: state.insultLoad * (1 - clamp(fraction, 0, 0.8)) };
}

export function toHistoryPoint(snapshot: InflammationSnapshot): InflammationHistoryPoint {
  return {
    t: snapshot.state.simTimeSeconds,
    insultLoad: snapshot.derived.insultLoad,
    neutrophilCount10e9PerL: snapshot.derived.neutrophilCount10e9PerL,
    crpMgL: snapshot.derived.crpMgL,
    pusBurden: snapshot.derived.pusBurden,
  };
}

export { SIMULATION };
