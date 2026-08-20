import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbCalciumInfusion, step } from './engine';
import { CALCIUM_PRESETS, DEFAULT_CALCIUM_INPUTS } from './presets';
import { CALCIUM, PHOSPHATE } from './constants';
import type { CalciumInputs, CalciumState } from './types';

function runFor(inputs: CalciumInputs, seconds: number, dt = 1, startState?: CalciumState) {
  let state = startState ?? createInitialState();
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < seconds; t += dt) {
    const result = step(state, inputs, dt);
    state = result.state;
    derived = result.derived;
  }
  return { state, derived };
}

function settle(presetName: keyof typeof CALCIUM_PRESETS, seconds = 20000) {
  const inputs: CalciumInputs = { ...DEFAULT_CALCIUM_INPUTS, ...CALCIUM_PRESETS[presetName] };
  return runFor(inputs, seconds).derived;
}

describe('engine — normal homeostasis', () => {
  it('holds calcium and phosphate near their setpoints', () => {
    const derived = settle('normal');
    expect(derived.serumCalciumMgDl).toBeGreaterThan(8.5);
    expect(derived.serumCalciumMgDl).toBeLessThan(10.5);
    expect(derived.serumPhosphateMgDl).toBeGreaterThan(2);
    expect(derived.serumPhosphateMgDl).toBeLessThan(5);
  });

  it('corrects an acute calcium infusion back toward the setpoint', () => {
    const settled = runFor(DEFAULT_CALCIUM_INPUTS, 20000).state;
    const infused = perturbCalciumInfusion(settled);
    expect(infused.serumCalciumMgDl).toBeGreaterThan(settled.serumCalciumMgDl);

    const corrected = runFor(DEFAULT_CALCIUM_INPUTS, 20000, 1, infused).derived;
    expect(corrected.serumCalciumMgDl).toBeLessThan(infused.serumCalciumMgDl);
    expect(corrected.serumCalciumMgDl).toBeLessThan(10.5);
  });

  it('never produces NaN/Infinity, and keeps all values within their clamps', () => {
    const extremes: CalciumInputs[] = [];
    for (const renalFunction of [0, 1.5]) {
      for (const parathyroidGlandFunction of [0, 1.5]) {
        for (const vitaminDIntake of [0, 200]) {
          for (const serumMagnesium of [0.5, 3]) {
            for (const autonomousPTHSecretion of [0, 100]) {
              extremes.push({
                ...DEFAULT_CALCIUM_INPUTS,
                renalFunction,
                parathyroidGlandFunction,
                vitaminDIntake,
                serumMagnesium,
                autonomousPTHSecretion,
              });
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const { derived } = runFor(inputs, 8000, 2);
      for (const [key, value] of Object.entries(derived)) {
        expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
      }
      expect(derived.serumCalciumMgDl).toBeGreaterThanOrEqual(CALCIUM.MIN_MGDL - 1e-6);
      expect(derived.serumCalciumMgDl).toBeLessThanOrEqual(CALCIUM.MAX_MGDL + 1e-6);
      expect(derived.serumPhosphateMgDl).toBeGreaterThanOrEqual(PHOSPHATE.MIN_MGDL - 1e-6);
      expect(derived.serumPhosphateMgDl).toBeLessThanOrEqual(PHOSPHATE.MAX_MGDL + 1e-6);
      for (const level of [derived.pthLevel, derived.calcitriolLevel, derived.calcitoninLevel]) {
        expect(level).toBeGreaterThanOrEqual(-1e-6);
        expect(level).toBeLessThanOrEqual(1 + 1e-6);
      }
    }
  });
});

describe('engine — primary hyperparathyroidism', () => {
  it('produces high calcium with LOW phosphate and non-suppressed PTH (the classic triad)', () => {
    const normal = settle('normal');
    const derived = settle('primaryHyperparathyroidism');

    expect(derived.serumCalciumMgDl).toBeGreaterThan(normal.serumCalciumMgDl);
    expect(derived.serumCalciumMgDl).toBeGreaterThan(10.5);
    // PTH is phosphaturic — this divergence is the whole teaching point.
    expect(derived.serumPhosphateMgDl).toBeLessThan(normal.serumPhosphateMgDl);
    expect(derived.pthLevel).toBeGreaterThan(0.4);
  });
});

describe('engine — hypoparathyroidism', () => {
  it('produces the mirror image: low calcium with HIGH phosphate and low PTH', () => {
    const normal = settle('normal');
    const derived = settle('hypoparathyroidism');

    expect(derived.serumCalciumMgDl).toBeLessThan(8.5);
    expect(derived.serumPhosphateMgDl).toBeGreaterThan(normal.serumPhosphateMgDl);
    expect(derived.pthLevel).toBeLessThan(0.1);
  });
});

describe('engine — vitamin D deficiency', () => {
  it('impairs gut calcium absorption and drives a compensatory secondary PTH rise', () => {
    const normal = settle('normal');
    const derived = settle('vitaminDDeficiency');

    expect(derived.calcitriolLevel).toBeLessThan(0.15);
    expect(derived.gutCaAbsorptionFraction).toBeLessThan(normal.gutCaAbsorptionFraction);
    expect(derived.pthLevel).toBeGreaterThan(normal.pthLevel);
    expect(derived.serumCalciumMgDl).toBeLessThan(normal.serumCalciumMgDl);
  });
});

describe('engine — CKD mineral bone disease', () => {
  it('produces high phosphate, low calcitriol, and severe secondary hyperparathyroidism', () => {
    const normal = settle('normal');
    const derived = settle('ckdMineralBoneDisease');

    // The failing kidney can neither excrete phosphate nor activate vitamin D.
    expect(derived.serumPhosphateMgDl).toBeGreaterThan(normal.serumPhosphateMgDl);
    expect(derived.calcitriolLevel).toBeLessThan(normal.calcitriolLevel);
    expect(derived.pthLevel).toBeGreaterThan(normal.pthLevel);
    expect(derived.calciumPhosphateProduct).toBeGreaterThan(normal.calciumPhosphateProduct);
  });
});

describe('engine — hypomagnesemia', () => {
  it('produces hypocalcemia with an inappropriately LOW PTH, unlike every other hypocalcemic state', () => {
    const normal = settle('normal');
    const hypomagnesemic = settle('hypomagnesemia');
    const vitDDeficient = settle('vitaminDDeficiency');

    expect(hypomagnesemic.serumCalciumMgDl).toBeLessThan(normal.serumCalciumMgDl);
    // The paradox: hypocalcemia that should maximally drive PTH instead shows it suppressed,
    // because magnesium is permissive for secretion — and PTH is lower here than in the
    // other hypocalcemic preset, where the axis responds normally.
    expect(hypomagnesemic.pthLevel).toBeLessThan(vitDDeficient.pthLevel);
  });

  it('the PTH axis stays switched off until magnesium itself is corrected, not by calcium loading', () => {
    const hypomagnesemicInputs: CalciumInputs = { ...DEFAULT_CALCIUM_INPUTS, ...CALCIUM_PRESETS.hypomagnesemia };
    const depleted = runFor(hypomagnesemicInputs, 20000).state;

    // Loading dietary calcium raises serum calcium but leaves the axis itself dead.
    const calciumLoaded = runFor({ ...hypomagnesemicInputs, dietaryCalciumIntake: 2000 }, 20000, 1, depleted).derived;
    expect(calciumLoaded.pthLevel).toBeLessThan(0.02);

    // Correcting the magnesium is what actually restores PTH secretion — and at the same
    // dietary calcium intake, restores serum calcium with it.
    const magnesiumCorrected = runFor({ ...hypomagnesemicInputs, serumMagnesium: 2.0 }, 20000, 1, depleted).derived;
    const stillDepleted = runFor(hypomagnesemicInputs, 20000, 1, depleted).derived;

    expect(magnesiumCorrected.pthLevel).toBeGreaterThan(0.2);
    expect(magnesiumCorrected.serumCalciumMgDl).toBeGreaterThan(stillDepleted.serumCalciumMgDl);
  });
});
