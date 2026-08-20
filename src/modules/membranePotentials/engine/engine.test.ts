import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbStimulate, step } from './engine';
import { DEFAULT_MEMBRANE_INPUTS, MEMBRANE_PRESETS } from './presets';
import { MEMBRANE } from './constants';
import { eK, eNa } from './nernst';
import type { MembraneInputs, MembraneState } from './types';

const DT = 0.00001;

function settle(inputs: MembraneInputs, steps = 12000): MembraneState {
  let state = createInitialState();
  for (let i = 0; i < steps; i++) state = step(state, inputs, DT).state;
  return state;
}

/** Fires a stimulus into a settled cell and reports the resulting waveform's shape. */
function fireSpike(inputs: MembraneInputs, steps = 3000) {
  let state = perturbStimulate(settle(inputs));
  let peakMv = -Infinity;
  let minHAfterPeak = 1;
  let durationAboveMinus40Ms = 0;

  for (let i = 0; i <= steps; i++) {
    const derived = computeDerived(state, inputs);
    peakMv = Math.max(peakMv, derived.vmMillivolts);
    minHAfterPeak = Math.min(minHAfterPeak, derived.gNaInactivation);
    if (derived.vmMillivolts > -40) durationAboveMinus40Ms += DT * 1000;
    state = step(state, inputs, DT).state;
  }
  return { peakMv, minHAfterPeak, durationAboveMinus40Ms };
}

function presetInputs(name: keyof typeof MEMBRANE_PRESETS): MembraneInputs {
  return { ...DEFAULT_MEMBRANE_INPUTS, ...MEMBRANE_PRESETS[name] };
}

describe('nernst — equilibrium potentials', () => {
  it('gives the textbook E_K and E_Na at normal concentrations', () => {
    expect(eK(4, 37)).toBeCloseTo(-95, 0);
    expect(eNa(140, 37)).toBeCloseTo(61.5, 0);
  });

  it('raising extracellular K+ moves E_K toward zero', () => {
    expect(eK(8.5, 37)).toBeGreaterThan(eK(4, 37));
  });
});

describe('engine — resting membrane potential', () => {
  it('rests near E_K, but slightly positive to it because of the small Na+ leak', () => {
    const inputs = presetInputs('normal');
    const derived = computeDerived(settle(inputs), inputs);

    expect(derived.vmMillivolts).toBeGreaterThan(-90);
    expect(derived.vmMillivolts).toBeLessThan(-80);
    expect(derived.vmMillivolts).toBeGreaterThan(derived.eK);
    // Sodium channels are essentially all available and closed at rest.
    expect(derived.gNaInactivation).toBeGreaterThan(0.9);
    expect(derived.gNa).toBeLessThan(0.01);
  });

  it('never produces NaN/Infinity across extreme inputs, and stays within the voltage clamps', () => {
    const extremes: MembraneInputs[] = [];
    for (const extracellularK of [2, 10]) {
      for (const gNaMaxDensity of [0, 2]) {
        for (const gKMaxDensity of [0, 2]) {
          for (const temperature of [30, 42]) {
            extremes.push({ ...DEFAULT_MEMBRANE_INPUTS, extracellularK, gNaMaxDensity, gKMaxDensity, temperature, stimulusIntensity: 50 });
          }
        }
      }
    }

    for (const inputs of extremes) {
      let state = perturbStimulate(settle(inputs, 4000));
      for (let i = 0; i < 4000; i++) state = step(state, inputs, DT).state;
      const derived = computeDerived(state, inputs);

      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      expect(derived.vmMillivolts).toBeGreaterThanOrEqual(MEMBRANE.MIN_MV - 1e-6);
      expect(derived.vmMillivolts).toBeLessThanOrEqual(MEMBRANE.MAX_MV + 1e-6);
      for (const gate of [derived.gNaActivation, derived.gNaInactivation, derived.gKActivation]) {
        expect(gate).toBeGreaterThanOrEqual(0);
        expect(gate).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('engine — the action potential', () => {
  it('fires an all-or-nothing spike that overshoots zero and repolarizes', () => {
    const inputs = presetInputs('normal');
    const { peakMv, durationAboveMinus40Ms } = fireSpike(inputs);

    expect(peakMv).toBeGreaterThan(0);
    // A neuronal spike lasts on the order of a couple of milliseconds.
    expect(durationAboveMinus40Ms).toBeGreaterThan(0.5);
    expect(durationAboveMinus40Ms).toBeLessThan(5);

    // It returns to rest afterward rather than sticking depolarized.
    let state = perturbStimulate(settle(inputs));
    for (let i = 0; i < 6000; i++) state = step(state, inputs, DT).state;
    expect(computeDerived(state, inputs).vmMillivolts).toBeLessThan(-70);
  });

  it('deeply inactivates sodium channels at the peak — the basis of the refractory period', () => {
    const { minHAfterPeak } = fireSpike(presetInputs('normal'));
    expect(minHAfterPeak).toBeLessThan(MEMBRANE.REFRACTORY_H_THRESHOLD);
  });
});

describe('engine — hyperkalemia', () => {
  it('depolarizes the resting potential and progressively inactivates sodium channels', () => {
    const normal = computeDerived(settle(presetInputs('normal')), presetInputs('normal'));
    const hyperkalemicInputs = presetInputs('hyperkalemia');
    const hyperkalemic = computeDerived(settle(hyperkalemicInputs), hyperkalemicInputs);

    expect(hyperkalemic.vmMillivolts).toBeGreaterThan(normal.vmMillivolts);
    // The paradox: sitting closer to threshold, yet with far fewer sodium channels available
    // to actually generate a spike.
    expect(hyperkalemic.gNaInactivation).toBeLessThan(normal.gNaInactivation);
  });

  it('reduces the excitability reserve monotonically as extracellular K+ climbs', () => {
    const availability = [4, 6, 8, 10].map((extracellularK) => {
      const inputs: MembraneInputs = { ...DEFAULT_MEMBRANE_INPUTS, extracellularK };
      return computeDerived(settle(inputs), inputs).excitability;
    });

    for (let i = 1; i < availability.length; i++) {
      expect(availability[i]!).toBeLessThan(availability[i - 1]!);
    }
  });
});

describe('engine — sodium channel blockade (local anesthetic)', () => {
  it('abolishes the regenerative spike entirely', () => {
    const { peakMv } = fireSpike(presetInputs('localAnesthetic'));
    expect(peakMv).toBeLessThan(-40);
  });
});

describe('engine — potassium channel blockade (class III antiarrhythmic)', () => {
  it('prolongs the action potential by delaying repolarization', () => {
    const normal = fireSpike(presetInputs('normal'));
    const blocked = fireSpike(presetInputs('potassiumBlocker'));

    expect(blocked.peakMv).toBeGreaterThan(0);
    expect(blocked.durationAboveMinus40Ms).toBeGreaterThan(normal.durationAboveMinus40Ms * 1.5);
  });
});

describe('engine — hypothermia', () => {
  it('prolongs the action potential and slows conduction, without abolishing either', () => {
    const normalInputs = presetInputs('normal');
    const coldInputs = presetInputs('hypothermia');

    const normal = fireSpike(normalInputs);
    const cold = fireSpike(coldInputs);
    expect(cold.peakMv).toBeGreaterThan(0);
    expect(cold.durationAboveMinus40Ms).toBeGreaterThan(normal.durationAboveMinus40Ms);

    const normalCv = computeDerived(settle(normalInputs), normalInputs).conductionVelocityMPerS;
    const coldCv = computeDerived(settle(coldInputs), coldInputs).conductionVelocityMPerS;
    expect(coldCv).toBeLessThan(normalCv);
  });
});

describe('engine — demyelination', () => {
  it('slows conduction dramatically while the axon still fires normally — a conduction problem, not an excitability one', () => {
    const normalInputs = presetInputs('normal');
    const demyelinatedInputs = presetInputs('demyelination');

    const demyelinated = fireSpike(demyelinatedInputs);
    expect(demyelinated.peakMv).toBeGreaterThan(0);

    const normalCv = computeDerived(settle(normalInputs), normalInputs).conductionVelocityMPerS;
    const demyelinatedCv = computeDerived(settle(demyelinatedInputs), demyelinatedInputs).conductionVelocityMPerS;
    expect(demyelinatedCv).toBeLessThan(normalCv * 0.3);
  });
});
