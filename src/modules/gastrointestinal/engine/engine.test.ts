import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbEatMeal, step } from './engine';
import { DEFAULT_GI_INPUTS, GI_PRESETS } from './presets';
import { GASTRIC_PH, DUODENAL_PH } from './constants';
import type { GiInputs, GiState } from './types';

function runFor(inputs: GiInputs, seconds: number, dt = 1, startState?: GiState) {
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
  it('stays essentially unstimulated with no meal queued', () => {
    const { derived } = runFor(DEFAULT_GI_INPUTS, 600);
    expect(derived.isFasting).toBe(true);
    expect(derived.gastricVolumeFraction).toBeLessThan(0.01);
    expect(derived.gastricPH).toBeGreaterThan(3.5);
  });

  it('cycles the migrating motor complex through phase III while fasting', () => {
    const { state: soon } = runFor(DEFAULT_GI_INPUTS, 30);
    const { state: later } = runFor(DEFAULT_GI_INPUTS, 200, 1, soon);
    expect(later.motilinPhase).not.toBeCloseTo(soon.motilinPhase, 1);
  });

  it('never produces NaN/Infinity, and keeps all actuators within their clamps', () => {
    const extremeInputs: GiInputs[] = [
      { ...DEFAULT_GI_INPUTS, mealFatGrams: 0, mealProteinGrams: 0, mealCarbGrams: 0, mealVolumeML: 0, vagalTone: 0 },
      { ...DEFAULT_GI_INPUTS, mealFatGrams: 100, mealProteinGrams: 100, mealCarbGrams: 150, mealVolumeML: 1000, vagalTone: 200 },
      { ...DEFAULT_GI_INPUTS, ppiDose: 150, h2BlockerDose: 150 },
      { ...DEFAULT_GI_INPUTS, autonomousGastrinSecretion: 100 },
    ];

    for (const inputs of extremeInputs) {
      let state = perturbEatMeal(createInitialState());
      const { state: finalState, derived } = runFor(inputs, 1200, 1, state);
      state = finalState;
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      expect(derived.gastricPH).toBeGreaterThanOrEqual(GASTRIC_PH.MIN_PH - 1e-6);
      expect(derived.gastricPH).toBeLessThanOrEqual(GASTRIC_PH.MAX_PH + 1e-6);
      expect(derived.duodenalPH).toBeGreaterThanOrEqual(DUODENAL_PH.MIN_PH - 1e-6);
      expect(derived.duodenalPH).toBeLessThanOrEqual(DUODENAL_PH.MAX_PH + 1e-6);
      for (const drive of [derived.gastrinDrive, derived.cckDrive, derived.secretinDrive, derived.gipGlp1Drive, derived.somatostatinDrive]) {
        expect(drive).toBeGreaterThanOrEqual(-1e-6);
        expect(drive).toBeLessThanOrEqual(1 + 1e-6);
      }
      expect(state.gastricVolumeFraction).toBeGreaterThanOrEqual(0);
      expect(state.gastricVolumeFraction).toBeLessThanOrEqual(1);
    }
  });
});

describe('engine — eating a normal meal', () => {
  it('acidifies the stomach, raises gut hormones, and drains the gastric volume over time', () => {
    const fasted = runFor(DEFAULT_GI_INPUTS, 300).state;
    const fastedDerived = computeDerived(fasted, DEFAULT_GI_INPUTS);

    const mealInputs: GiInputs = { ...DEFAULT_GI_INPUTS, ...GI_PRESETS.normalMeal };
    const justAte = perturbEatMeal(fasted);
    expect(computeDerived(justAte, mealInputs).gastricVolumeFraction).toBeCloseTo(1, 5);

    const digesting = runFor(mealInputs, 400, 1, justAte);
    expect(digesting.derived.gastricPH).toBeLessThan(fastedDerived.gastricPH);
    expect(digesting.derived.gastrinDrive).toBeGreaterThan(0.1);
    expect(digesting.derived.cckDrive).toBeGreaterThan(0.05);
    expect(digesting.derived.secretinDrive).toBeGreaterThan(0);

    const emptied = runFor(mealInputs, 2000, 1, justAte).state;
    expect(emptied.gastricVolumeFraction).toBeLessThan(0.1);
  });

  it('duodenal pH dips as acid arrives, then recovers as secretin-driven bicarbonate catches up', () => {
    const fasted = runFor(DEFAULT_GI_INPUTS, 300).state;
    const mealInputs: GiInputs = { ...DEFAULT_GI_INPUTS, ...GI_PRESETS.normalMeal };
    const justAte = perturbEatMeal(fasted);

    const early = runFor(mealInputs, 150, 1, justAte).derived.duodenalPH;
    const late = runFor(mealInputs, 3000, 1, justAte).derived.duodenalPH;
    expect(early).toBeLessThan(DUODENAL_PH.BASELINE);
    expect(late).toBeGreaterThan(early);
  });
});

describe('engine — high-fat meal slows gastric emptying', () => {
  it('leaves more gastric volume remaining at a fixed time point than an equivalent normal meal', () => {
    const fasted = runFor(DEFAULT_GI_INPUTS, 300).state;

    const normalInputs: GiInputs = { ...DEFAULT_GI_INPUTS, ...GI_PRESETS.normalMeal };
    const fattyInputs: GiInputs = { ...DEFAULT_GI_INPUTS, ...GI_PRESETS.highFatMeal };

    const normalRemaining = runFor(normalInputs, 900, 1, perturbEatMeal(fasted)).state.gastricVolumeFraction;
    const fattyRemaining = runFor(fattyInputs, 900, 1, perturbEatMeal(fasted)).state.gastricVolumeFraction;

    expect(fattyRemaining).toBeGreaterThan(normalRemaining);
  });
});

describe('engine — PPI vs H2 blocker', () => {
  it('a PPI suppresses acid output more completely than an H2 blocker at an equivalent meal', () => {
    const fasted = runFor(DEFAULT_GI_INPUTS, 300).state;

    const untreated: GiInputs = { ...DEFAULT_GI_INPUTS, ...GI_PRESETS.normalMeal };
    const ppi: GiInputs = { ...DEFAULT_GI_INPUTS, ...GI_PRESETS.ppiTherapy };
    const h2: GiInputs = { ...untreated, h2BlockerDose: 100 };

    const untreatedPH = runFor(untreated, 600, 1, perturbEatMeal(fasted)).derived.gastricPH;
    const ppiPH = runFor(ppi, 600, 1, perturbEatMeal(fasted)).derived.gastricPH;
    const h2PH = runFor(h2, 600, 1, perturbEatMeal(fasted)).derived.gastricPH;

    expect(ppiPH).toBeGreaterThan(untreatedPH);
    expect(h2PH).toBeGreaterThan(untreatedPH);
    expect(ppiPH).toBeGreaterThan(h2PH);
  });
});

describe('engine — gastrinoma (Zollinger-Ellison)', () => {
  it('drives persistent acid output with no meal, unsuppressed by the somatostatin brake', () => {
    const inputs: GiInputs = { ...DEFAULT_GI_INPUTS, ...GI_PRESETS.gastrinoma };
    const { derived } = runFor(inputs, 1200);

    expect(derived.gastricVolumeFraction).toBeLessThan(0.01);
    expect(derived.gastrinDrive).toBeGreaterThan(0.6);
    expect(derived.gastricPH).toBeLessThan(3);
  });
});

describe('engine — vagotomy blunts but does not abolish the acid response', () => {
  it('produces a smaller acid output and a higher (less acidic) gastric pH than an intact vagus, but still responds to the meal', () => {
    const fasted = runFor(DEFAULT_GI_INPUTS, 300).state;

    const intact: GiInputs = { ...DEFAULT_GI_INPUTS, ...GI_PRESETS.normalMeal };
    const vagotomized: GiInputs = { ...DEFAULT_GI_INPUTS, ...GI_PRESETS.vagotomy };

    const intactResult = runFor(intact, 400, 1, perturbEatMeal(fasted)).derived;
    const vagotomizedResult = runFor(vagotomized, 400, 1, perturbEatMeal(fasted)).derived;

    // Losing direct vagal ACh drive reduces total acid output even though gastrin itself can
    // paradoxically run a little higher (weaker acid-mediated somatostatin brake) — the acid
    // response, not the gastrin level, is the load-bearing physiological claim here.
    expect(vagotomizedResult.gastricAcidOutput).toBeLessThan(intactResult.gastricAcidOutput);
    expect(vagotomizedResult.gastricPH).toBeGreaterThan(intactResult.gastricPH);
    expect(vagotomizedResult.gastrinDrive).toBeGreaterThan(0.05);
  });
});
