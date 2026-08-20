import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbEatMeal, perturbGiveInsulin, step } from './engine';
import { DEFAULT_GLUCOSE_INPUTS, GLUCOSE_PRESETS } from './presets';
import { BLOOD_GLUCOSE } from './constants';
import type { GlucoseInputs, GlucoseState } from './types';

function runFor(inputs: GlucoseInputs, seconds: number, dt = 1, startState?: GlucoseState) {
  let state = startState ?? createInitialState();
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < seconds; t += dt) {
    const result = step(state, inputs, dt);
    state = result.state;
    derived = result.derived;
  }
  return { state, derived };
}

describe('engine — fasting baseline', () => {
  it('holds blood glucose near baseline with no meal and normal capacities', () => {
    const { derived } = runFor(DEFAULT_GLUCOSE_INPUTS, 1200);
    expect(derived.bloodGlucoseMgDl).toBeGreaterThan(70);
    expect(derived.bloodGlucoseMgDl).toBeLessThan(100);
  });

  it('never produces NaN/Infinity, and keeps all actuators within their clamps', () => {
    const extremeInputs: GlucoseInputs[] = [
      { mealCarbLoadGrams: 0, exogenousInsulinUnits: 0, insulinSecretionCapacity: 0, insulinResistance: 0, glucagonSecretionCapacity: 0 },
      { mealCarbLoadGrams: 150, exogenousInsulinUnits: 20, insulinSecretionCapacity: 1.5, insulinResistance: 2, glucagonSecretionCapacity: 1.5 },
      { mealCarbLoadGrams: 150, exogenousInsulinUnits: 0, insulinSecretionCapacity: 0, insulinResistance: 0, glucagonSecretionCapacity: 1.5 },
    ];

    for (const inputs of extremeInputs) {
      let state = perturbEatMeal(createInitialState(), inputs.mealCarbLoadGrams);
      state = perturbGiveInsulin(state, inputs.exogenousInsulinUnits);
      const { state: finalState, derived } = runFor(inputs, 3600, 1, state);
      state = finalState;
      for (const [key, value] of Object.entries(derived)) {
        expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
      }
      expect(derived.bloodGlucoseMgDl).toBeGreaterThanOrEqual(BLOOD_GLUCOSE.MIN_MGDL - 1e-6);
      expect(derived.bloodGlucoseMgDl).toBeLessThanOrEqual(BLOOD_GLUCOSE.MAX_MGDL + 1e-6);
      expect(state.hepaticGlycogenReserve).toBeGreaterThanOrEqual(0.05 - 1e-6);
      expect(state.hepaticGlycogenReserve).toBeLessThanOrEqual(1 + 1e-6);
    }
  });
});

describe('engine — normal meal response', () => {
  it('raises glucose and insulin after eating, then returns them toward baseline', () => {
    const fasted = runFor(DEFAULT_GLUCOSE_INPUTS, 300).state;
    const inputs: GlucoseInputs = { ...DEFAULT_GLUCOSE_INPUTS, ...GLUCOSE_PRESETS.normal };
    const justAte = perturbEatMeal(fasted, inputs.mealCarbLoadGrams);

    const soon = runFor(inputs, 200, 1, justAte).derived;
    expect(soon.bloodGlucoseMgDl).toBeGreaterThan(90);
    expect(soon.insulinLevel).toBeGreaterThan(0.1);

    const later = runFor({ ...DEFAULT_GLUCOSE_INPUTS }, 5000, 1, runFor(inputs, 400, 1, justAte).state).derived;
    expect(later.bloodGlucoseMgDl).toBeLessThan(soon.bloodGlucoseMgDl);
    expect(later.bloodGlucoseMgDl).toBeGreaterThan(60);
  });
});

describe('engine — type 1 diabetes', () => {
  it('produces a much larger, unchecked hyperglycemic excursion than a normal insulin response to the same meal', () => {
    const fasted = runFor(DEFAULT_GLUCOSE_INPUTS, 300).state;

    const normalInputs: GlucoseInputs = { ...DEFAULT_GLUCOSE_INPUTS, ...GLUCOSE_PRESETS.normal };
    const t1dmInputs: GlucoseInputs = { ...DEFAULT_GLUCOSE_INPUTS, ...GLUCOSE_PRESETS.type1Diabetes };

    const normal = runFor(normalInputs, 300, 1, perturbEatMeal(fasted, normalInputs.mealCarbLoadGrams)).derived;
    const t1dm = runFor(t1dmInputs, 300, 1, perturbEatMeal(fasted, t1dmInputs.mealCarbLoadGrams)).derived;

    expect(t1dm.insulinLevel).toBeCloseTo(0, 1);
    expect(t1dm.bloodGlucoseMgDl).toBeGreaterThan(normal.bloodGlucoseMgDl);
    expect(t1dm.bloodGlucoseMgDl).toBeGreaterThan(150);
  });

  it('exogenous insulin still lowers glucose despite zero endogenous capacity', () => {
    const fasted = runFor(DEFAULT_GLUCOSE_INPUTS, 300).state;
    const inputs: GlucoseInputs = { ...DEFAULT_GLUCOSE_INPUTS, ...GLUCOSE_PRESETS.type1Diabetes };
    const hyperglycemic = runFor(inputs, 900, 1, perturbEatMeal(fasted, inputs.mealCarbLoadGrams)).state;

    const withoutInsulin = runFor(inputs, 600, 1, hyperglycemic).derived.bloodGlucoseMgDl;
    const withInsulin = runFor(inputs, 600, 1, perturbGiveInsulin(hyperglycemic, 10)).derived.bloodGlucoseMgDl;

    expect(withInsulin).toBeLessThan(withoutInsulin);
  });
});

describe('engine — type 2 diabetes (insulin resistance)', () => {
  it('produces a larger post-meal glucose excursion than normal despite an intact/compensating insulin response', () => {
    const fasted = runFor(DEFAULT_GLUCOSE_INPUTS, 300).state;

    const normalInputs: GlucoseInputs = { ...DEFAULT_GLUCOSE_INPUTS, ...GLUCOSE_PRESETS.normal };
    const t2dmInputs: GlucoseInputs = { ...DEFAULT_GLUCOSE_INPUTS, ...GLUCOSE_PRESETS.type2Diabetes };

    const normalPeak = runFor(normalInputs, 300, 1, perturbEatMeal(fasted, normalInputs.mealCarbLoadGrams)).derived.bloodGlucoseMgDl;
    const t2dmPeak = runFor(t2dmInputs, 300, 1, perturbEatMeal(fasted, t2dmInputs.mealCarbLoadGrams)).derived.bloodGlucoseMgDl;
    const t2dmInsulin = runFor(t2dmInputs, 300, 1, perturbEatMeal(fasted, t2dmInputs.mealCarbLoadGrams)).derived.insulinLevel;

    expect(t2dmPeak).toBeGreaterThan(normalPeak);
    expect(t2dmInsulin).toBeGreaterThan(0.1);
  });
});

describe('engine — fasting hypoglycemia and counter-regulation', () => {
  it('engages glucagon and counter-regulation while an insulin bolus is active, with no meal to buffer it', () => {
    const fasted = runFor(DEFAULT_GLUCOSE_INPUTS, 300).state;
    const overdosed = perturbGiveInsulin(fasted, 15);

    // Sampled near the glucose nadir, while the bolus is still active.
    const nadir = runFor(DEFAULT_GLUCOSE_INPUTS, 180, 1, overdosed).derived;
    expect(nadir.bloodGlucoseMgDl).toBeLessThan(70);
    expect(nadir.hypoglycemiaSeverity).toBeGreaterThan(0);
    expect(nadir.glucagonLevel).toBeGreaterThan(0.3);
    expect(nadir.counterRegulatoryDrive).toBeGreaterThan(0.1);
    expect(nadir.bloodGlucoseMgDl).toBeGreaterThan(BLOOD_GLUCOSE.MIN_MGDL);

    // Once the bolus decays, the defenses restore glucose back toward baseline.
    const recovered = runFor(DEFAULT_GLUCOSE_INPUTS, 3000, 1, overdosed).derived;
    expect(recovered.bloodGlucoseMgDl).toBeGreaterThan(nadir.bloodGlucoseMgDl);
    expect(recovered.bloodGlucoseMgDl).toBeGreaterThan(80);
  });
});
