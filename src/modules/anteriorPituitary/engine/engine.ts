import { BROMOCRIPTINE, GH_AXIS, PITUITARY_SIMULATION, PROLACTIN_AXIS, SOMATIC } from './constants';
import {
  classifyPituitary,
  effectiveDopamineFraction,
  gonadalSuppressionPct,
  heightVelocityCmPerYear,
  patternSummary,
  prolactinFromBrake,
  stalkCompressionFraction,
  visualFieldDefectPct,
} from './pituitaryMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type {
  PituitaryDerived,
  PituitaryInputs,
  PituitaryInternalState,
  PituitarySnapshot,
} from './types';

export function createInitialState(): PituitaryInternalState {
  return {
    simTimeSeconds: 0,
    ghNgMl: 2.2,
    igf1NgMl: 200,
    prolactinNgMl: 10,
    acromegalicIndex: 0,
    glucoseChallengeSecondsRemaining: 0,
    bromocriptineEffectPct: 0,
  };
}

export function computeDerived(state: PituitaryInternalState, inputs: PituitaryInputs): PituitaryDerived {
  const ghAdenomaCc = clamp((inputs.ghAdenomaSecretion / 100) * 3, 0, 3);
  // Bromocriptine shrinks PROLACTINOMA tissue; GH adenomas barely respond.
  const shrinkFactor = clamp(1 - (state.bromocriptineEffectPct / 100) * BROMOCRIPTINE.SHRINKAGE_PER_EFFECT_PCT * 1.6, 0.25, 1);
  const prlAdenomaCc = clamp((inputs.prolactinomaSecretion / 100) * 5 * shrinkFactor, 0, 5);
  const massCc = clamp((inputs.nonfunctioningMass / 100) * 7, 0, 7);
  const totalMassCc = ghAdenomaCc + prlAdenomaCc + massCc;
  const stalk = stalkCompressionFraction(totalMassCc);
  const dopamineEffective = effectiveDopamineFraction(
    inputs.dopamineTonePct,
    inputs.d2ReceptorBlockPct,
    state.bromocriptineEffectPct,
    stalk,
  );

  return {
    ghNgMl: state.ghNgMl,
    igf1NgMl: state.igf1NgMl,
    prolactinNgMl: state.prolactinNgMl,
    effectiveDopamineFraction: dopamineEffective,
    stalkCompressionFraction: stalk,
    totalMassCc,
    ghAdenomaCc,
    prlAdenomaCc,
    nonfunctioningCc: massCc,
    visualFieldDefectPct: visualFieldDefectPct(totalMassCc),
    heightVelocityCmPerYear: heightVelocityCmPerYear(state.igf1NgMl, inputs.epiphysesOpen > 0.5),
    acromegalicIndex: state.acromegalicIndex,
    gonadalSuppressionPct: gonadalSuppressionPct(state.prolactinNgMl),
    galactorrhoeaRiskPct: clamp(((state.prolactinNgMl - 60) / 140) * 100, 0, 100),
    glucoseSuppressionTest:
      state.glucoseChallengeSecondsRemaining > 0
        ? state.ghNgMl < 1
          ? 'suppressed (normal)'
          : 'fails to suppress'
        : 'not tested',
    classification: classifyPituitary(classificationPatternOf(state, inputs)),
    patternSummary: '',
    dopamineTonePct: inputs.dopamineTonePct,
    d2ReceptorBlockPct: inputs.d2ReceptorBlockPct,
    trhStimulusUnits: inputs.trhStimulusUnits,
    bromocriptineEffectPct: state.bromocriptineEffectPct,
  };
}

function classificationPatternOf(state: PituitaryInternalState, inputs: PituitaryInputs) {
  return {
    ghNgMl: state.ghNgMl,
    igf1NgMl: state.igf1NgMl,
    prolactinNgMl: state.prolactinNgMl,
    ghAdenomaSecretion: inputs.ghAdenomaSecretion,
    prolactinomaSecretion: inputs.prolactinomaSecretion,
    nonfunctioningMass: inputs.nonfunctioningMass,
    d2BlockPct: inputs.d2ReceptorBlockPct,
    trhStimulusUnits: inputs.trhStimulusUnits,
    epiphysesOpen: inputs.epiphysesOpen,
  };
}

/** Full derived assembly shared by computeDerived's second pass inside step(). */
export function computeDerivedFull(
  state: PituitaryInternalState,
  inputs: PituitaryInputs,
): PituitaryDerived {
  const base = computeDerived(state, inputs);
  const classificationPattern = classificationPatternOf(state, inputs);
  return {
    ...base,
    patternSummary: patternSummary({
      ...classificationPattern,
      classification: base.classification,
      visualFieldDefectPct: base.visualFieldDefectPct,
      gonadalSuppressionPct: base.gonadalSuppressionPct,
    }),
  };
}

export function tick(
  state: PituitaryInternalState,
  inputs: PituitaryInputs,
  effectiveDopamine: number,
  dtSeconds: number,
): PituitaryInternalState {
  const challengeActive = state.glucoseChallengeSecondsRemaining > 0;

  // Regulated GH obeys the hypothalamus (and therefore glucose); the adenoma ignores both.
  const regulatedGh =
    GH_AXIS.BASE_GH_NG_ML * (challengeActive ? 1 - GH_AXIS.GLUCOSE_SUPPRESSION_FRACTION : 1);
  const autonomousGh = (inputs.ghAdenomaSecretion / 100) * 30;
  const ghTarget = regulatedGh + autonomousGh;

  const igf1Target =
    GH_AXIS.IGF1_MIN_NG_ML + 45 * clamp(state.ghNgMl, 0, 14);

  const brakeProlactin = prolactinFromBrake(effectiveDopamine);
  const trhComponent = Math.max(0, inputs.trhStimulusUnits - 10) * PROLACTIN_AXIS.TRH_GAIN_PER_UNIT;
  // Prolactinoma secretion is itself dopamine-suppressible — bromocriptine works both ways.
  const shrinkFromDrug = 1 - (state.bromocriptineEffectPct / 100) * (BROMOCRIPTINE.DOSE_EFFECT_PCT / 40);
  const autonomousPrl =
    (inputs.prolactinomaSecretion / 100) *
    PROLACTIN_AXIS.PROLACTINOMA_GAIN_PER_UNIT *
    Math.max(0, shrinkFromDrug);
  const prlTarget = clamp(brakeProlactin + trhComponent + autonomousPrl, 4, 1200);

  const acroTarget =
    state.igf1NgMl >= GH_AXIS.IGF1_ACROMEGALY_THRESHOLD
      ? // Open growth plates shunt much of the excess into linear growth instead of tissue.
        SOMATIC.ACRO_INDEX_MAX * (1 - 0.65 * clamp(inputs.epiphysesOpen, 0, 1))
      : 0;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    ghNgMl: approach(state.ghNgMl, ghTarget, dtSeconds, GH_AXIS.GH_TAU_SECONDS),
    igf1NgMl: approach(state.igf1NgMl, igf1Target, dtSeconds, GH_AXIS.IGF1_TAU_SECONDS),
    prolactinNgMl: approach(state.prolactinNgMl, prlTarget, dtSeconds, PROLACTIN_AXIS.PROLACTIN_TAU_SECONDS),
    acromegalicIndex: approach(state.acromegalicIndex, acroTarget, dtSeconds, SOMATIC.ACROMEGALY_TAU_SECONDS),
    glucoseChallengeSecondsRemaining: Math.max(0, state.glucoseChallengeSecondsRemaining - dtSeconds),
    bromocriptineEffectPct: Math.max(
      0,
      state.bromocriptineEffectPct - (state.bromocriptineEffectPct * dtSeconds) / BROMOCRIPTINE.DECAY_TAU_SECONDS,
    ),
  };
}

export function step(state: PituitaryInternalState, inputs: PituitaryInputs, dtSeconds: number): PituitarySnapshot {
  const dopamineEff = computeDerived(state, inputs).effectiveDopamineFraction;
  const nextState = tick(state, inputs, dopamineEff, dtSeconds);
  return { state: nextState, derived: computeDerivedFull(nextState, inputs) };
}

/** The oral glucose tolerance test: regulated GH suppresses below 1; an adenoma ignores it. */
export function perturbGlucoseLoad(state: PituitaryInternalState): PituitaryInternalState {
  return { ...state, glucoseChallengeSecondsRemaining: GH_AXIS.CHALLENGE_DURATION_SECONDS };
}

/** A dose of dopamine agonist: restores braking and shrinks prolactinoma tissue over weeks. */
export function perturbBromocriptineDose(state: PituitaryInternalState): PituitaryInternalState {
  return { ...state, bromocriptineEffectPct: Math.min(100, state.bromocriptineEffectPct + BROMOCRIPTINE.DOSE_EFFECT_PCT) };
}

export { PITUITARY_SIMULATION };
