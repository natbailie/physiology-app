import { HORMONE, LABOUR, PREGNANCY_SIMULATION } from './constants';
import {
  bicarbonateMmolL,
  cardiacOutputIncreasePct,
  classifyPregnancy,
  creatinineMgDl,
  dilationRateCmPerMin,
  fetalWeightG,
  gfrIncreasePct,
  haemoglobinGPerDl,
  meanArterialPressureMmHg,
  milkSupplyTargetMlPerDay,
  oxytocinDuringLabour,
  paCO2MmHg,
  patternSummary,
  phArterial,
  plasmaVolIncreasePct,
  pregnancyProgress,
  progesteroneTargetNgMl,
  prolactinTargetNgMl,
  redCellMassIncreasePct,
  serumSodiumMmolL,
  svrChangePct,
  uteroplacentalFlowSharePct,
} from './pregnancyMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type {
  PregnancyDerived,
  PregnancyInputs,
  PregnancyInternalState,
  PregnancySnapshot,
} from './types';

export function createInitialState(): PregnancyInternalState {
  return {
    simTimeSeconds: 0,
    progesteroneNgMl: 80,
    prolactinNgMl: 120,
    milkSupplyMlPerDay: 0,
    postpartumSeconds: 0,
    oxytocinLetDownTimerSeconds: 0,
    labourActive: false,
    cervicalDilationCm: 0,
    deliveredOverride: false,
  };
}

export function computeDerived(state: PregnancyInternalState, inputs: PregnancyInputs): PregnancyDerived {
  const weeks = clamp(inputs.gestationalWeeks, 4, 42);
  const twins = clamp(inputs.twinGestation, 0, 1);
  const placentaFrac = clamp(inputs.placentalFunctionPct, 0, 100) / 100;
  const suckling = clamp(inputs.sucklingDrivePct, 0, 100);
  const deliveredEffective = state.deliveredOverride || inputs.deliveredMode > 0.5;
  const progress = pregnancyProgress(weeks);

  const pvInc = plasmaVolIncreasePct(weeks, twins, placentaFrac);
  const rcmInc = redCellMassIncreasePct(weeks, twins);
  const hb = haemoglobinGPerDl(clamp(inputs.baselineHaemoglobinGPerDl, 9, 15), rcmInc, pvInc);

  const classificationPattern = {
    weeks,
    twins,
    placentaPct: clamp(inputs.placentalFunctionPct, 0, 100),
    labourActive: state.labourActive,
    delivered: deliveredEffective,
    sucklingPct: suckling,
    milkSupplyMlPerDay: state.milkSupplyMlPerDay,
  };

  // Oxytocin: basal, plus Ferguson drive in labour, plus a transient let-down pulse.
  let oxytocin = 6 + suckling * 0.08;
  if (state.labourActive) oxytocin += oxytocinDuringLabour(state.cervicalDilationCm);
  if (state.oxytocinLetDownTimerSeconds > 0)
    oxytocin += LABOUR.LET_DOWN_OXYTOCIN_SPIKE * (state.oxytocinLetDownTimerSeconds / LABOUR.LET_DOWN_PULSE_SECONDS);

  return {
    pregnancyProgressFraction: progress,
    plasmaVolIncreasePct: pvInc,
    redCellMassIncreasePct: rcmInc,
    haemoglobinGPerDl: hb,
    cardiacOutputIncreasePct: cardiacOutputIncreasePct(weeks, twins, deliveredEffective),
    svrChangePct: svrChangePct(weeks, placentaFrac),
    meanArterialPressureMmHg: meanArterialPressureMmHg(weeks, placentaFrac),
    paCO2MmHg: paCO2MmHg(weeks),
    bicarbonateMmolL: bicarbonateMmolL(weeks),
    phArterial: phArterial(weeks),
    gfrIncreasePct: gfrIncreasePct(weeks),
    creatinineMgDl: creatinineMgDl(weeks),
    serumSodiumMmolL: serumSodiumMmolL(weeks),
    fetalWeightG: fetalWeightG(weeks, placentaFrac),
    uteroplacentalFlowSharePct: uteroplacentalFlowSharePct(weeks),
    progesteroneNgMl: state.progesteroneNgMl,
    prolactinNgMl: state.prolactinNgMl,
    oxytocinRelative: oxytocin,
    milkSupplyMlPerDay: state.milkSupplyMlPerDay,
    cervicalDilationCm: state.cervicalDilationCm,
    deliveredEffective,
    classification: classifyPregnancy(classificationPattern),
    patternSummary: patternSummary({
      classification: classifyPregnancy(classificationPattern),
      haemoglobinGPerDl: hb,
      paCO2MmHg: paCO2MmHg(weeks),
      creatinineMgDl: creatinineMgDl(weeks),
      fetalWeightG: fetalWeightG(weeks, placentaFrac),
      milkSupplyMlPerDay: state.milkSupplyMlPerDay,
      progesteroneNgMl: state.progesteroneNgMl,
    }),
  };
}

export function tick(
  state: PregnancyInternalState,
  derived: PregnancyDerived,
  inputs: PregnancyInputs,
  dtSeconds: number,
): PregnancyInternalState {
  const weeks = clamp(inputs.gestationalWeeks, 4, 42);
  const suckling = clamp(inputs.sucklingDrivePct, 0, 100);
  const deliveredEffective = derived.deliveredEffective;

  // Labour progresses by the Ferguson reflex and completes into the puerperium.
  let dilation = state.cervicalDilationCm;
  let labourActive = state.labourActive && !deliveredEffective;
  let justDelivered = false;
  if (labourActive) {
    dilation += dilationRateCmPerMin(dilation) * (dtSeconds / 60);
    if (dilation >= LABOUR.DILATION_COMPLETE_CM) {
      dilation = LABOUR.DILATION_COMPLETE_CM;
      labourActive = false;
      justDelivered = true;
    }
  }

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    progesteroneNgMl: approach(
      state.progesteroneNgMl,
      progesteroneTargetNgMl(weeks, deliveredEffective),
      dtSeconds,
      HORMONE.PROGESTERONE_TAU_SECONDS,
    ),
    prolactinNgMl: approach(
      state.prolactinNgMl,
      prolactinTargetNgMl(weeks, deliveredEffective, suckling, state.postpartumSeconds),
      dtSeconds,
      PROLACTIN_APPROACH_TAU_SECONDS,
    ),
    milkSupplyMlPerDay: approach(
      state.milkSupplyMlPerDay,
      milkSupplyTargetMlPerDay(state.progesteroneNgMl, state.prolactinNgMl, suckling),
      dtSeconds,
      LACTATION_SUPPLY_TAU_SECONDS,
    ),
    postpartumSeconds: deliveredEffective ? state.postpartumSeconds + dtSeconds : 0,
    oxytocinLetDownTimerSeconds: Math.max(0, state.oxytocinLetDownTimerSeconds - dtSeconds),
    labourActive,
    cervicalDilationCm: dilation,
    deliveredOverride: state.deliveredOverride || justDelivered,
  };
}

const PROLACTIN_APPROACH_TAU_SECONDS = 40000;
const LACTATION_SUPPLY_TAU_SECONDS = 170000;

export function step(state: PregnancyInternalState, inputs: PregnancyInputs, dtSeconds: number): PregnancySnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** Onset of labour: the Ferguson reflex takes over until delivery completes. */
export function perturbStartLabour(state: PregnancyInternalState): PregnancyInternalState {
  if (state.deliveredOverride) return state;
  return { ...state, labourActive: true, cervicalDilationCm: Math.max(1, state.cervicalDilationCm) };
}

/** A feed: let-down pulse of oxytocin. */
export function perturbFeedNow(state: PregnancyInternalState): PregnancyInternalState {
  return { ...state, oxytocinLetDownTimerSeconds: LABOUR.LET_DOWN_PULSE_SECONDS };
}

export { PREGNANCY_SIMULATION };
