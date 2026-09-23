import { ANAESTHESIA } from './constants';
import { approach, clamp } from '@/shared/lib/math';
import type {
  AnaesthesiaDerived,
  AnaesthesiaHistoryPoint,
  AnaesthesiaInputs,
  AnaesthesiaInternalState,
  AnaesthesiaSnapshot,
} from './types';

/** Effective inspired concentration at the Y-piece, percent: the dial scaled by the share of the
 * circuit flow that is actually fresh gas rather than re-breathed gas. */
function inspiredFractionOf(inputs: AnaesthesiaInputs): number {
  const { dialPct, freshGasFlowLMin } = inputs;
  const freshShare = freshGasFlowLMin / (freshGasFlowLMin + ANAESTHESIA.REBREATHING_LMIN);
  return clamp(dialPct * freshShare, 0, 8);
}

/** Circuit wash-in time constant, minutes: how long the fresh gas takes to replace the circuit. */
function tauCircuit(inputs: AnaesthesiaInputs): number {
  return ANAESTHESIA.CIRCUIT_VOLUME_L / inputs.freshGasFlowLMin;
}

/** Alveolar wash-in time constant, minutes: how long alveolar ventilation takes to sweep the FRC. */
function tauAlveolar(): number {
  return ANAESTHESIA.ALVEOLAR_VOLUME_L / ANAESTHESIA.ALVEOLAR_VENTILATION_LMIN;
}

/** Blood-uptake time constant, minutes: how long the perfused blood column takes to charge against
 * a given solubility and cardiac output. This is the lambda-times-flow story in closed form. */
function tauBlood(inputs: AnaesthesiaInputs): number {
  return (inputs.bloodGasSolubility * ANAESTHESIA.PERFUSED_LOAD_VOLUME_L) / Math.max(inputs.cardiacOutputLMin, 0.1);
}

/** Combined wash-in time constant driving the alveolar level toward its ceiling. */
function tauInMinutes(inputs: AnaesthesiaInputs): number {
  return tauCircuit(inputs) + tauAlveolar() + tauBlood(inputs);
}

/** Minutes for the effect-site to follow the blood level — solubility governs the blood-brain lag. */
function tauBrainMinutes(inputs: AnaesthesiaInputs): number {
  return ANAESTHESIA.BRAIN_TAU_MIN_PER_LAMBDA * inputs.bloodGasSolubility;
}

/** Steady-state efficiency of the alveolar ceiling against the inspired fraction. Soluble agents
 * keep a measurable uptake deficit; near-instant-on agents almost match their inspired level. */
function efficiencyOf(inputs: AnaesthesiaInputs): number {
  return clamp(
    ANAESTHESIA.EFF_BASE - ANAESTHESIA.EFF_PER_LAMBDA * inputs.bloodGasSolubility,
    ANAESTHESIA.EFF_MIN,
    ANAESTHESIA.EFF_MAX,
  );
}

/** The equilibrium alveolar ceiling the state relaxes toward, percent. */
function alveolaeEquilibriumOf(inputs: AnaesthesiaInputs): number {
  return inspiredFractionOf(inputs) * efficiencyOf(inputs);
}

/** The phase label: what the learner is watching right now. */
function stateOf(derived: AnaesthesiaDerived): string {
  if (derived.dialPct < 0.1) return 'Wash-out — emergence';
  if (derived.washInProgress < 0.5) return 'Wash-in — induction';
  if (derived.washInProgress < 0.9) return 'Rising toward steady state';
  return 'Equilibrated — maintenance';
}

export function createInitialState(): AnaesthesiaInternalState {
  return {
    simTimeSeconds: 0,
    alveolarAgentPct: 0,
    effectSiteAgentPct: 0,
  };
}

export function computeDerived(state: AnaesthesiaInternalState, inputs: AnaesthesiaInputs): AnaesthesiaDerived {
  const inspired = inspiredFractionOf(inputs);
  const ceiling = alveolaeEquilibriumOf(inputs);
  const tauIn = tauInMinutes(inputs);
  const derived: AnaesthesiaDerived = {
    dialPct: inputs.dialPct,
    freshGasFlowLMin: inputs.freshGasFlowLMin,
    bloodGasSolubility: inputs.bloodGasSolubility,
    cardiacOutputLMin: inputs.cardiacOutputLMin,
    inspiredFractionPct: inspired,
    inspiredToDialRatio: inputs.dialPct > 0 ? inspired / inputs.dialPct : 0,
    alveolarAgentPct: state.alveolarAgentPct,
    effectSiteAgentPct: state.effectSiteAgentPct,
    washInProgress: ceiling > 0 ? clamp(state.alveolarAgentPct / ceiling, 0, 1) : 0,
    timeTo90PctMinutes: tauIn * Math.log(10),
    timeTo50PctMinutes: tauIn * Math.log(2),
    absorptionIndex: inputs.bloodGasSolubility * inputs.cardiacOutputLMin * state.alveolarAgentPct,
    state: '',
  };
  derived.state = stateOf(derived);
  return derived;
}

/** Relax the alveolar and effect-site levels toward their ceilings with the flow- and
 * solubility-dependent time constants — the wash-in a learner actually watches. */
export function tick(state: AnaesthesiaInternalState, inputs: AnaesthesiaInputs, dtSeconds: number): AnaesthesiaInternalState {
  const ceiling = alveolaeEquilibriumOf(inputs);
  const tauInSeconds = tauInMinutes(inputs) * 60;
  const tauBrainSeconds = tauBrainMinutes(inputs) * 60;
  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    alveolarAgentPct: approach(state.alveolarAgentPct, ceiling, dtSeconds, tauInSeconds),
    effectSiteAgentPct: approach(state.effectSiteAgentPct, state.alveolarAgentPct, dtSeconds, tauBrainSeconds),
  };
}

export function step(state: AnaesthesiaInternalState, inputs: AnaesthesiaInputs, dtSeconds: number): AnaesthesiaSnapshot {
  const nextState = tick(state, inputs, dtSeconds);
  return { state: nextState, derived: computeDerived(nextState, inputs) };
}

export function toHistoryPoint(snapshot: AnaesthesiaSnapshot): AnaesthesiaHistoryPoint {
  return {
    t: snapshot.state.simTimeSeconds,
    alveolar: snapshot.derived.alveolarAgentPct,
    brain: snapshot.derived.effectSiteAgentPct,
  };
}

/** `AnaesthesiaSnapshot` re-exported so engine consumers can name it without re-importing types. */
export type { AnaesthesiaSnapshot };