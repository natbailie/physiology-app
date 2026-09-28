import { describe, expect, it } from 'vitest';
import { bunOf, computeDerived, createInitialState, step } from './engine';
import { DEFAULT_UREA_CYCLE_INPUTS } from './presets';
import type { UreaCycleInputs } from './types';

function settledUrea(inputs: UreaCycleInputs): number {
  let state = createInitialState();
  for (let t = 0; t < 3600; t += 0.2) state = step(state, inputs, 0.2).state;
  return computeDerived(state, inputs).ureaMmolL;
}

/**
 * Analytic oracles: published identities written out inside the test, importing nothing from
 * the engine but the value under test.
 *
 * BUN is not a second model of anything — it is urea restated in ward units, and the factor
 * between them is fixed by molecular weights: urea (CO(NH2)2, 60 g/mol) carries two nitrogens
 * (28 g/mol), and a litre holds ten decilitres. So BUN in mg/dL is urea in mmol/L times 2.8,
 * for ANY input at all, which no amount of miscalibration could produce by accident.
 */
describe('urea-cycle analytic identities', () => {
  it('reports BUN as urea times 28/10 for arbitrary nitrogen loads', () => {
    // 28 g nitrogen per mole of urea, 10 dL per L — written out, not imported.
    const expectedFactor = (14 * 2) / 10;
    for (const protein of [0, 40, 70, 130, 200]) {
      for (const stress of [0, 0.5, 1]) {
        const inputs = { ...DEFAULT_UREA_CYCLE_INPUTS, proteinIntakeGPerDay: protein, catabolicStress: stress };
        const derived = computeDerived(createInitialState(), inputs);
        expect(derived.bunMgDl).toBeCloseTo(derived.ureaMmolL * expectedFactor, 10);
        expect(bunOf(derived.ureaMmolL)).toBeCloseTo(derived.ureaMmolL * expectedFactor, 10);
      }
    }
  });

  it('scales urea linearly with load at fixed capacity and hydration', () => {
    // At fixed clearance and dilution the engine is urea = k * load, so the slope between any
    // two loads is the same constant — the mass-balance shape, not a fitted curve.
    const at = (protein: number): number =>
      settledUrea({ ...DEFAULT_UREA_CYCLE_INPUTS, proteinIntakeGPerDay: protein });
    const slope = (a: number, b: number): number => {
      const loadOf = (p: number): number => p / 6.25;
      return (at(b) - at(a)) / (loadOf(b) - loadOf(a));
    };
    const s1 = slope(40, 80);
    const s2 = slope(120, 180);
    expect(s1).toBeGreaterThan(0);
    expect(s2 / s1).toBeCloseTo(1, 6);
  });
});
