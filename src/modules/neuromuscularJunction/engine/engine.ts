import { BLOCKADE, RELEASE } from './constants';
import {
  classify,
  endPlatePotential,
  patternSummary,
  postTetanicRatio,
  quantalContent,
  receptorAvailability,
  safetyFactor,
  trainOfFour,
  transmissionProbability,
} from './transmission';
import { approach, clamp } from '@/shared/lib/math';
import type { NmjDerived, NmjInputs, NmjSnapshot, NmjState } from './types';

export function createInitialState(): NmjState {
  return { simTimeSeconds: 0, vesiclePool: 1, residualCalcium: 0, desensitisation: 0 };
}

export function computeDerived(state: NmjState, inputs: NmjInputs): NmjDerived {
  const availability = receptorAvailability(inputs, state.desensitisation);
  const quanta = quantalContent(inputs, state.vesiclePool, state.residualCalcium);
  const epp = endPlatePotential(inputs, quanta, availability);
  const factor = safetyFactor(epp);
  const probability = transmissionProbability(factor);

  const train = trainOfFour(inputs, state.desensitisation);
  const first = train[0] ?? 0;
  const last = train[3] ?? 0;
  const tofRatio = first <= 0.001 ? 1 : clamp(last / first, 0, 2);
  const ptRatio = postTetanicRatio(inputs, state.desensitisation);

  return {
    quantalContent: quanta,
    endPlatePotentialMv: epp,
    safetyFactor: factor,
    transmissionProbability: probability,
    trainOfFour: train,
    trainOfFourRatio: tofRatio,
    postTetanicRatio: ptRatio,
    muscleForcePercent: probability * 100,
    vesiclePool: state.vesiclePool,
    residualCalcium: state.residualCalcium,
    desensitisation: state.desensitisation,
    classification: classify(inputs, tofRatio, ptRatio, factor),
    patternSummary: patternSummary(tofRatio, ptRatio, factor),
    vesicleReleaseCapacity: inputs.vesicleReleaseCapacity,
    calciumChannelFunction: inputs.calciumChannelFunction,
    receptorDensity: inputs.receptorDensity,
    acetylcholinesteraseActivity: inputs.acetylcholinesteraseActivity,
    nondepolarisingBlocker: inputs.nondepolarisingBlocker,
    depolarisingBlocker: inputs.depolarisingBlocker,
    stimulationFrequencyHz: inputs.stimulationFrequencyHz,
  };
}

export function tick(state: NmjState, _derived: NmjDerived, inputs: NmjInputs, dtSeconds: number): NmjState {
  const impulsesThisTick = Math.max(0, inputs.stimulationFrequencyHz) * dtSeconds;

  // Use and refill run against each other continuously; at rest refill wins, and during rapid
  // stimulation it cannot keep up — which is what makes repeated transmission the informative test.
  const used = impulsesThisTick * RELEASE.TONIC_USE_PER_IMPULSE;
  const refilled = (1 - state.vesiclePool) * (1 - Math.exp(-dtSeconds / RELEASE.POOL_REFILL_TAU_SECONDS));

  const calciumGained = impulsesThisTick * RELEASE.CALCIUM_PER_IMPULSE;
  const calciumDecayed = state.residualCalcium * (1 - Math.exp(-dtSeconds / RELEASE.CALCIUM_DECAY_TAU_SECONDS));

  // A depolarising agonist holds the receptor open and it desensitises — phase II block, which
  // is why suxamethonium behaves like a non-depolarising blocker if enough is given.
  // Too much agonist reaches the same end point whether it was given as a drug or produced by
  // blocking the enzyme that clears it.
  const agonistLoad = clamp(inputs.depolarisingBlocker / 100, 0, 1);
  const cholinergicExcess = clamp(
    (BLOCKADE.CHOLINERGIC_BLOCK_THRESHOLD - inputs.acetylcholinesteraseActivity) /
      BLOCKADE.CHOLINERGIC_BLOCK_THRESHOLD,
    0,
    1,
  );
  const desensitisationTarget = BLOCKADE.DESENSITISATION_GAIN * Math.max(agonistLoad, cholinergicExcess);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    vesiclePool: clamp(state.vesiclePool - used + refilled, 0, 1),
    residualCalcium: clamp(state.residualCalcium + calciumGained - calciumDecayed, 0, 2),
    desensitisation: approach(
      state.desensitisation,
      desensitisationTarget,
      dtSeconds,
      desensitisationTarget > state.desensitisation
        ? BLOCKADE.DESENSITISATION_TAU_SECONDS
        : BLOCKADE.RECOVERY_TAU_SECONDS,
    ),
  };
}

export function step(state: NmjState, inputs: NmjInputs, dtSeconds: number): NmjSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** A tetanic burst: loads the terminal with calcium and draws down the vesicle pool. What
 * happens next is diagnostic — a presynaptic lesion is briefly stronger, a postsynaptic one is not. */
export function perturbTetanicBurst(state: NmjState): NmjState {
  return {
    ...state,
    residualCalcium: clamp(state.residualCalcium + 0.6, 0, 2),
    vesiclePool: clamp(state.vesiclePool - 0.18, 0, 1),
  };
}

/** Rest: let the terminal refill completely, as it would between examinations. */
export function perturbRest(state: NmjState): NmjState {
  return { ...state, vesiclePool: 1, residualCalcium: 0 };
}
