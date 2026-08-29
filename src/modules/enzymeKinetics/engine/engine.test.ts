import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { apparentKmMm, apparentVmax, phFactor, rateAt, temperatureFactor } from './kinetics';
import { DEFAULT_KINETICS_INPUTS, KINETICS_PRESETS } from './presets';
import type { KineticsInputs } from './types';

const DT = 0.05;

function settled(inputs: KineticsInputs, seconds = 8): KineticsInputs['substrateMm'] extends never ? never : ReturnType<typeof computeDerived> {
  let state = createInitialState();
  for (let t = 0; t < seconds; t += DT) state = step(state, inputs, DT).state;
  return computeDerived(state, inputs);
}

function preset(name: keyof typeof KINETICS_PRESETS, overrides: Partial<KineticsInputs> = {}): KineticsInputs {
  return { ...DEFAULT_KINETICS_INPUTS, ...KINETICS_PRESETS[name], ...overrides };
}

describe('michaelis-menten curve shape', () => {
  it('is near-linear far below Km and saturates at Vmax far above it', () => {
    const low = rateAt(0.05, 50, 0.5);
    const mid = rateAt(0.5, 50, 0.5);
    const high = rateAt(10, 50, 0.5);

    // First-order region: quadrupling substrate roughly quadruples velocity.
    expect(low).toBeLessThan(mid * 0.2);
    // Half-maximal at exactly Km — the DEFINITION.
    expect(mid).toBeCloseTo(25, 1);
    // Zero-order plateau: twenty times Km buys almost nothing more.
    expect(high).toBeGreaterThan(45);
    expect(high).toBeLessThan(50);
    expect(high).toBeLessThan(rateAt(20, 50, 0.5) * 1.02);
  });

  it('never produces NaN across extreme inputs', () => {
    for (const inhibitorType of ['none', 'competitive', 'noncompetitive', 'uncompetitive'] as const) {
      for (const substrateMm of [0, 20]) {
        for (const temperatureC of [10, 50]) {
          for (const ph of [4, 9]) {
            const inputs: KineticsInputs = { ...DEFAULT_KINETICS_INPUTS, inhibitorType, substrateMm, temperatureC, ph };
            const derived = computeDerived(createInitialState(), inputs);
            for (const [key, value] of Object.entries(derived)) {
              if (typeof value === 'number') {
                expect(Number.isFinite(value), `${key} for ${JSON.stringify(inputs)}`).toBe(true);
              }
            }
          }
        }
      }
    }
  });
});

describe('inhibition signatures', () => {
  it('competitive inhibition raises apparent Km and leaves Vmax alone', () => {
    const inputs = preset('competitive');
    expect(apparentKmMm(inputs.kmMm, inputs.inhibitorType, inputs.inhibitorUm, inputs.kiUm)).toBeGreaterThan(
      inputs.kmMm * 5,
    );
    expect(apparentVmax(inputs.vmaxUmPerMin, inputs.inhibitorType, inputs.inhibitorUm, inputs.kiUm)).toBeCloseTo(
      inputs.vmaxUmPerMin,
      6,
    );
  });

  it('noncompetitive inhibition cuts Vmax and leaves Km untouched', () => {
    const inputs = preset('noncompetitive');
    expect(apparentVmax(inputs.vmaxUmPerMin, inputs.inhibitorType, inputs.inhibitorUm, inputs.kiUm)).toBeLessThan(
      inputs.vmaxUmPerMin / 5,
    );
    expect(apparentKmMm(inputs.kmMm, inputs.inhibitorType, inputs.inhibitorUm, inputs.kiUm)).toBeCloseTo(inputs.kmMm, 6);
  });

  it('uncompetitive inhibition lowers BOTH constants together', () => {
    const inputs = preset('uncompetitive');
    const km = apparentKmMm(inputs.kmMm, inputs.inhibitorType, inputs.inhibitorUm, inputs.kiUm);
    const vmax = apparentVmax(inputs.vmaxUmPerMin, inputs.inhibitorType, inputs.inhibitorUm, inputs.kiUm);
    expect(km).toBeLessThan(inputs.kmMm / 3);
    expect(vmax).toBeLessThan(inputs.vmaxUmPerMin / 3);
    // The signature: the RATIO stays fixed, so the Lineweaver-Burk line shifts but keeps
    // its slope — parallel lines on the double-reciprocal plot.
    expect(vmax / km).toBeCloseTo(inputs.vmaxUmPerMin / inputs.kmMm, 5);
  });

  it('enough substrate overcomes a competitive inhibitor but never a noncompetitive one', () => {
    const competitive = preset('competitive');
    const noncompetitive = preset('noncompetitive');

    const floodedCompetitive = rateAt(20, apparentVmax(competitive.vmaxUmPerMin, competitive.inhibitorType, competitive.inhibitorUm, competitive.kiUm), apparentKmMm(competitive.kmMm, competitive.inhibitorType, competitive.inhibitorUm, competitive.kiUm));
    const floodedNoncompetitive = rateAt(20, apparentVmax(noncompetitive.vmaxUmPerMin, noncompetitive.inhibitorType, noncompetitive.inhibitorUm, noncompetitive.kiUm), apparentKmMm(noncompetitive.kmMm, noncompetitive.inhibitorType, noncompetitive.inhibitorUm, noncompetitive.kiUm));

    expect(floodedCompetitive).toBeGreaterThan(35);
    expect(floodedNoncompetitive).toBeLessThan(6);
  });
});

describe('environmental factors', () => {
  it('a moderate fever accelerates reactions; heat illness denatures them below baseline', () => {
    expect(temperatureFactor(41)).toBeGreaterThan(1.2);
    expect(temperatureFactor(47)).toBeLessThan(0.8);
  });

  it('acidaemia slows enzymes smoothly away from the physiological optimum', () => {
    expect(phFactor(7.4)).toBeCloseTo(1, 6);
    expect(phFactor(6.8)).toBeLessThan(0.7);
    expect(phFactor(8.0)).toBeLessThan(0.85);
    // Symmetric around the optimum.
    expect(phFactor(7.4 + 0.6)).toBeCloseTo(phFactor(7.4 - 0.6), 5);
  });

  it('the ethanol-for-methanol preset starves methanol of enzyme by flooding it with a rival', () => {
    const d = computeDerived(createInitialState(), preset('ethanolForMethanol'));
    // Apparent Km inflated far past the methanol concentration: the poison barely occupies
    // the enzyme, while ethanol (the "inhibitor") is what the patient is given on purpose.
    expect(d.apparentKmMm).toBeGreaterThan(preset('ethanolForMethanol').kmMm * 10);
  });
});

describe('the live readout', () => {
  it('settles onto the algebraic Michaelis-Menten rate', () => {
    const inputs = DEFAULT_KINETICS_INPUTS;
    const algebraic = rateAt(inputs.substrateMm, inputs.vmaxUmPerMin, inputs.kmMm);
    const d = settled(inputs);
    expect(d.reactionRateUmPerMin).toBeCloseTo(algebraic, 0);
    // Baseline calibration: default substrate sits AT Km, so the enzyme runs half-maximal.
    expect(d.saturationPct).toBeCloseTo(50, 0);
  });
});
