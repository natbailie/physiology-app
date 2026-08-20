import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbAcuteStressor, step } from './engine';
import { DEFAULT_HPA_INPUTS, HPA_PRESETS } from './presets';
import { CORTISOL } from './constants';
import type { HpaInputs, HpaState } from './types';

function runFor(inputs: HpaInputs, seconds: number, dt = 1, startState?: HpaState) {
  let state = startState ?? createInitialState();
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < seconds; t += dt) {
    const result = step(state, inputs, dt);
    state = result.state;
    derived = result.derived;
  }
  return { state, derived };
}

describe('engine — normal diurnal rhythm', () => {
  it('oscillates cortisol across a circadian cycle rather than settling flat', () => {
    // One full cycle is 240s; the peak lands well before the trough within a cycle.
    const peak = runFor(DEFAULT_HPA_INPUTS, 120).derived.cortisolLevel;
    const trough = runFor(DEFAULT_HPA_INPUTS, 240).derived.cortisolLevel;
    expect(peak).toBeGreaterThan(trough);
    expect(trough).toBeGreaterThan(5);
    expect(peak).toBeLessThan(20);
  });

  it('never produces NaN/Infinity, and keeps all actuators/cortisol within their clamps', () => {
    const extremes: HpaInputs[] = [];
    for (const acuteStressLevel of [0, 100]) {
      for (const exogenousGlucocorticoid of [0, 300]) {
        for (const pituitaryFunction of [0, 1.5]) {
          for (const adrenalCortexFunction of [0, 1.5]) {
            for (const autonomousAdrenalSecretion of [0, 100]) {
              extremes.push({ acuteStressLevel, exogenousGlucocorticoid, pituitaryFunction, adrenalCortexFunction, autonomousAdrenalSecretion });
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
      expect(derived.crhDrive).toBeGreaterThanOrEqual(0);
      expect(derived.crhDrive).toBeLessThanOrEqual(1);
      expect(derived.acthLevel).toBeGreaterThanOrEqual(0);
      expect(derived.acthLevel).toBeLessThanOrEqual(1);
      expect(derived.cortisolLevel).toBeGreaterThanOrEqual(CORTISOL.MIN_UGDL - 1e-6);
      expect(derived.cortisolLevel).toBeLessThanOrEqual(CORTISOL.MAX_UGDL + 1e-6);
      expect(state.adrenalReserve).toBeGreaterThanOrEqual(0.05 - 1e-6);
      expect(state.adrenalReserve).toBeLessThanOrEqual(1 + 1e-6);
    }
  });
});

describe('engine — acute stressor', () => {
  it('acutely raises CRH/ACTH/cortisol, then relaxes back toward baseline', () => {
    const baseline = runFor(DEFAULT_HPA_INPUTS, 600).state;
    const baselineDerived = computeDerived(baseline, DEFAULT_HPA_INPUTS);
    const stressed = perturbAcuteStressor(baseline);
    const immediate = computeDerived(stressed, DEFAULT_HPA_INPUTS);

    expect(immediate.acuteStressBolus).toBeGreaterThan(0);

    const soon = runFor(DEFAULT_HPA_INPUTS, 10, 1, stressed);
    expect(soon.derived.crhDrive).toBeGreaterThan(baselineDerived.crhDrive);

    const recovered = runFor(DEFAULT_HPA_INPUTS, 600, 1, stressed);
    expect(recovered.state.acuteStressBolus).toBeLessThan(0.01);
  });
});

describe("engine — Addison's disease (primary adrenal insufficiency)", () => {
  it('produces low cortisol with high (unsuppressed) ACTH', () => {
    const inputs: HpaInputs = { ...DEFAULT_HPA_INPUTS, ...HPA_PRESETS.addisons };
    const { derived } = runFor(inputs, 1800);

    expect(derived.cortisolLevel).toBeLessThan(6);
    expect(derived.acthLevel).toBeGreaterThan(0.9);
  });
});

describe('engine — secondary adrenal insufficiency (pituitary failure)', () => {
  it('produces low cortisol with low ACTH, distinguishing it from Addison\'s', () => {
    const inputs: HpaInputs = { ...DEFAULT_HPA_INPUTS, ...HPA_PRESETS.secondaryInsufficiency };
    const { derived } = runFor(inputs, 1800);

    expect(derived.cortisolLevel).toBeLessThan(6);
    expect(derived.acthLevel).toBeLessThan(0.15);
  });
});

describe('engine — adrenal adenoma (ACTH-independent Cushing\'s)', () => {
  it('produces elevated cortisol with suppressed ACTH', () => {
    const inputs: HpaInputs = { ...DEFAULT_HPA_INPUTS, ...HPA_PRESETS.adrenalAdenoma };
    const { derived } = runFor(inputs, 1800);

    expect(derived.cortisolLevel).toBeGreaterThan(15);
    expect(derived.acthLevel).toBeLessThan(0.05);
  });
});

describe('engine — steroid therapy and withdrawal (adrenal atrophy mechanism)', () => {
  it('progressively depletes adrenal reserve the longer exogenous steroid is sustained', () => {
    const inputs: HpaInputs = { ...DEFAULT_HPA_INPUTS, ...HPA_PRESETS.steroidTherapy };
    const short = runFor(inputs, 3600).state;
    const long = runFor(inputs, 86400).state;

    expect(short.adrenalReserve).toBeGreaterThan(0.8);
    expect(long.adrenalReserve).toBeLessThan(0.1);
  });

  it('shows an inadequate cortisol response shortly after withdrawal despite ACTH already rising, then normalizes over hours', () => {
    const inputs: HpaInputs = { ...DEFAULT_HPA_INPUTS, ...HPA_PRESETS.steroidTherapy };
    const depleted = runFor(inputs, 604800).state;
    expect(depleted.adrenalReserve).toBeLessThan(0.1);

    const withdrawnInputs: HpaInputs = { ...DEFAULT_HPA_INPUTS, exogenousGlucocorticoid: 0 };
    const soonAfter = runFor(withdrawnInputs, 600, 1, depleted);
    // ACTH has already responded, but cortisol can't keep up — the adrenal-crisis-risk picture.
    expect(soonAfter.derived.acthLevel).toBeGreaterThan(0.8);
    expect(soonAfter.derived.cortisolLevel).toBeLessThan(8);

    const recovered = runFor(withdrawnInputs, 21600, 1, depleted);
    expect(recovered.state.adrenalReserve).toBeGreaterThan(0.9);
    expect(recovered.derived.acthLevel).toBeLessThan(0.5);
  });
});
