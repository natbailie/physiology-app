import { CONDUCTANCE, GATING, IONS, MEMBRANE, STIMULUS } from './constants';
import { eK, eNa } from './nernst';
import { restingPotential, weightedMembranePotential } from './ghk';
import { hInfinity, mInfinity, nInfinity, temperatureScaledTau } from './gateKinetics';
import { conductionVelocity } from './conduction';
import { approach, clamp } from '@/shared/lib/math';
import type { MembraneDerived, MembraneInputs, MembraneSnapshot, MembraneState } from './types';

export function createInitialState(): MembraneState {
  const restVm = -86;
  return {
    simTimeSeconds: 0,
    vmMillivolts: restVm,
    gNaActivation: mInfinity(restVm),
    gNaInactivation: hInfinity(restVm),
    gKActivation: nInfinity(restVm),
    stimulusBolus: 0,
  };
}

/**
 * Computes every derived value for the current tick from the current membrane potential and
 * gate positions. Unlike the hormone modules — where `derived` is mostly a passthrough — here
 * the conductances genuinely are computed fresh each tick from the gates, since it is the
 * gates (not the voltage) that carry the state.
 */
export function computeDerived(state: MembraneState, inputs: MembraneInputs): MembraneDerived {
  const eNaMv = eNa(inputs.extracellularNa, inputs.temperature);
  const eKMv = eK(inputs.extracellularK, inputs.temperature);

  // HH-style powers: sodium conductance goes as m³h, potassium as n⁴. The exponents are what
  // make activation sigmoidal and steep rather than a gentle linear ramp.
  const gNa = CONDUCTANCE.MAX_GNA * inputs.gNaMaxDensity * Math.pow(state.gNaActivation, 3) * state.gNaInactivation;
  const gK = CONDUCTANCE.MAX_GK * inputs.gKMaxDensity * Math.pow(state.gKActivation, 4);

  return {
    vmMillivolts: state.vmMillivolts,
    eNa: eNaMv,
    eK: eKMv,
    gNa,
    gK,
    gLeak: IONS.LEAK_K_CONDUCTANCE + IONS.LEAK_NA_CONDUCTANCE,
    iNa: (gNa + IONS.LEAK_NA_CONDUCTANCE) * (eNaMv - state.vmMillivolts),
    iK: (gK + IONS.LEAK_K_CONDUCTANCE) * (eKMv - state.vmMillivolts),
    gNaActivation: state.gNaActivation,
    gNaInactivation: state.gNaInactivation,
    gKActivation: state.gKActivation,
    restingPotentialMv: restingPotential(eKMv, eNaMv),
    thresholdMv: MEMBRANE.THRESHOLD_MV,
    isRefractory: state.gNaInactivation < MEMBRANE.REFRACTORY_H_THRESHOLD,
    conductionVelocityMPerS: conductionVelocity(inputs.myelination, inputs.gNaMaxDensity, inputs.temperature),
    excitability: state.gNaInactivation,
    stimulusIntensity: inputs.stimulusIntensity,
    extracellularK: inputs.extracellularK,
    extracellularNa: inputs.extracellularNa,
    gNaMaxDensity: inputs.gNaMaxDensity,
    gKMaxDensity: inputs.gKMaxDensity,
    temperature: inputs.temperature,
    myelination: inputs.myelination,
  };
}

export function tick(state: MembraneState, derived: MembraneDerived, dtSeconds: number): MembraneState {
  // Total depolarizing drive from the continuous stimulus plus any transient bolus.
  const stimulusCurrent = (derived.stimulusIntensity * STIMULUS.CURRENT_GAIN + state.stimulusBolus) * 50;

  // The voltage the membrane is being pulled toward by the current conductances, offset by
  // the stimulus. Relaxing toward it with the membrane time constant is the equivalent-circuit
  // form of C·dV/dt = ΣI.
  const gNaTotal = derived.gNa + IONS.LEAK_NA_CONDUCTANCE;
  const gKTotal = derived.gK + IONS.LEAK_K_CONDUCTANCE;
  const targetVm = weightedMembranePotential(gNaTotal, derived.eNa, gKTotal, derived.eK) + stimulusCurrent;
  const totalConductance = gNaTotal + gKTotal;
  const membraneTau = MEMBRANE.CAPACITANCE_SECONDS / Math.max(totalConductance, 0.01);
  const nextVm = clamp(approach(state.vmMillivolts, targetVm, dtSeconds, membraneTau), MEMBRANE.MIN_MV, MEMBRANE.MAX_MV);

  // Each gate relaxes toward its voltage-dependent steady state on its own Q10-scaled tau.
  // The separation of those time constants is the entire mechanism of the action potential.
  const mTau = temperatureScaledTau(GATING.M_TAU_SECONDS, derived.temperature);
  const hTau = temperatureScaledTau(GATING.H_TAU_SECONDS, derived.temperature);
  const nTau = temperatureScaledTau(GATING.N_TAU_SECONDS, derived.temperature);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    vmMillivolts: nextVm,
    gNaActivation: clamp(approach(state.gNaActivation, mInfinity(state.vmMillivolts), dtSeconds, mTau), 0, 1),
    gNaInactivation: clamp(approach(state.gNaInactivation, hInfinity(state.vmMillivolts), dtSeconds, hTau), 0, 1),
    gKActivation: clamp(approach(state.gKActivation, nInfinity(state.vmMillivolts), dtSeconds, nTau), 0, 1),
    stimulusBolus: approach(state.stimulusBolus, 0, dtSeconds, STIMULUS.DECAY_TAU_SECONDS),
  };
}

export function step(state: MembraneState, inputs: MembraneInputs, dtSeconds: number): MembraneSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** "Stimulate" perturbation — a brief depolarizing pulse. Whether it actually triggers a spike
 * depends on whether it reaches threshold and on how much sodium availability (h) has
 * recovered, which is what makes the refractory period demonstrable. */
export function perturbStimulate(state: MembraneState, magnitude: number = STIMULUS.DEFAULT_BOLUS): MembraneState {
  return { ...state, stimulusBolus: state.stimulusBolus + magnitude };
}
