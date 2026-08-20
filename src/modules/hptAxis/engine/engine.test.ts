import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbAcuteIllness, step } from './engine';
import { DEFAULT_HPT_INPUTS, HPT_PRESETS } from './presets';
import { T4 } from './constants';
import type { HptInputs, HptState } from './types';

function runFor(inputs: HptInputs, seconds: number, dt = 1, startState?: HptState) {
  let state = startState ?? createInitialState();
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < seconds; t += dt) {
    const result = step(state, inputs, dt);
    state = result.state;
    derived = result.derived;
  }
  return { state, derived };
}

describe('engine — baseline steady state', () => {
  it('settles near normal T4/T3/TSH', () => {
    const { state, derived } = runFor(DEFAULT_HPT_INPUTS, 3600);
    expect(state.t4Level).toBeGreaterThan(5);
    expect(state.t4Level).toBeLessThan(12);
    expect(derived.t3Level).toBeGreaterThan(70);
    expect(derived.t3Level).toBeLessThan(120);
    expect(derived.tshLevel).toBeGreaterThan(0.1);
    expect(derived.tshLevel).toBeLessThan(0.6);
  });

  it('never produces NaN/Infinity, and keeps all actuators/T4 within their clamps', () => {
    const extremes: HptInputs[] = [];
    for (const thyroidGlandFunction of [0, 1.5]) {
      for (const pituitaryTshFunction of [0, 1.5]) {
        for (const autonomousThyroidStimulation of [0, 100]) {
          for (const exogenousLevothyroxine of [0, 300]) {
            for (const illnessSeverity of [0, 100]) {
              extremes.push({ thyroidGlandFunction, pituitaryTshFunction, autonomousThyroidStimulation, exogenousLevothyroxine, illnessSeverity });
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const { state, derived } = runFor(inputs, 600, 1);
      for (const [key, value] of Object.entries(derived)) {
        expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
      }
      expect(derived.trhDrive).toBeGreaterThanOrEqual(0);
      expect(derived.trhDrive).toBeLessThanOrEqual(1);
      expect(derived.tshLevel).toBeGreaterThanOrEqual(0);
      expect(derived.tshLevel).toBeLessThanOrEqual(1);
      expect(state.t4Level).toBeGreaterThanOrEqual(T4.MIN_UGDL - 1e-6);
      expect(state.t4Level).toBeLessThanOrEqual(T4.MAX_UGDL + 1e-6);
      expect(derived.t3Level).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('engine — acute illness (sick euthyroid mechanism, transient)', () => {
  it('drops T3 immediately while T4 lags, then recovers as the illness bolus resolves', () => {
    const baseline = runFor(DEFAULT_HPT_INPUTS, 3600).state;
    const baselineDerived = computeDerived(baseline, DEFAULT_HPT_INPUTS);
    const ill = perturbAcuteIllness(baseline);
    const immediate = computeDerived(ill, DEFAULT_HPT_INPUTS);

    expect(immediate.t3Level).toBeLessThan(baselineDerived.t3Level);
    expect(immediate.t4Level).toBeCloseTo(baselineDerived.t4Level, 1);

    const recovered = runFor(DEFAULT_HPT_INPUTS, 1800, 1, ill);
    expect(recovered.state.acuteIllnessBolus).toBeLessThan(0.01);
    expect(recovered.derived.t3Level).toBeGreaterThan(immediate.t3Level);
  });
});

describe("engine — primary hypothyroidism (Hashimoto's)", () => {
  it('produces low T4/T3 with high (unsuppressed) TSH', () => {
    const inputs: HptInputs = { ...DEFAULT_HPT_INPUTS, ...HPT_PRESETS.primaryHypothyroidism };
    const { state, derived } = runFor(inputs, 3600);

    expect(state.t4Level).toBeLessThan(6);
    expect(derived.tshLevel).toBeGreaterThan(0.9);
  });
});

describe('engine — secondary hypothyroidism (pituitary failure)', () => {
  it('produces low T4/T3 with low TSH, distinguishing it from primary hypothyroidism', () => {
    const inputs: HptInputs = { ...DEFAULT_HPT_INPUTS, ...HPT_PRESETS.secondaryHypothyroidism };
    const { state, derived } = runFor(inputs, 3600);

    expect(state.t4Level).toBeLessThan(6);
    expect(derived.tshLevel).toBeLessThan(0.25);
  });
});

describe("engine — Graves' disease", () => {
  it('produces elevated T4/T3 with suppressed TSH', () => {
    const inputs: HptInputs = { ...DEFAULT_HPT_INPUTS, ...HPT_PRESETS.graves };
    const { state, derived } = runFor(inputs, 3600);

    expect(state.t4Level).toBeGreaterThan(12);
    expect(derived.tshLevel).toBeLessThan(0.05);
  });
});

describe('engine — sick euthyroid syndrome', () => {
  it('shows disproportionately low T3 without the marked TSH elevation seen in primary hypothyroidism', () => {
    const sickInputs: HptInputs = { ...DEFAULT_HPT_INPUTS, ...HPT_PRESETS.sickEuthyroid };
    const primaryInputs: HptInputs = { ...DEFAULT_HPT_INPUTS, ...HPT_PRESETS.primaryHypothyroidism };
    const baselineT3 = runFor(DEFAULT_HPT_INPUTS, 3600).derived.t3Level;
    const sick = runFor(sickInputs, 3600);
    const primary = runFor(primaryInputs, 3600);

    expect(sick.derived.t3Level).toBeLessThan(baselineT3);
    // The key discriminator: sick euthyroid's TSH stays well short of primary hypothyroidism's
    // near-maximal TSH, even though T3 is clearly depressed in both.
    expect(sick.derived.tshLevel).toBeLessThan(primary.derived.tshLevel);
  });
});
