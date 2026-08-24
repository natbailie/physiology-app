import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbBromocriptineDose, perturbGlucoseLoad, step } from './engine';
import { DEFAULT_PITUITARY_INPUTS, PITUITARY_PRESETS } from './presets';
import type { PituitaryDerived, PituitaryInputs } from './types';

function settle(patch: Partial<PituitaryInputs>, seconds = 400000): PituitaryDerived {
  const inputs = { ...DEFAULT_PITUITARY_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 0.2);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe('baseline', () => {
  it('holds a healthy pituitary on textbook values', () => {
    const d = settle(PITUITARY_PRESETS.normal);
    expect(d.ghNgMl).toBeLessThan(4);
    expect(d.igf1NgMl).toBeGreaterThan(150);
    expect(d.prolactinNgMl).toBeLessThan(25);
    expect(d.classification).toBe('normal anterior pituitary');
    expect(d.visualFieldDefectPct).toBe(0);
  });
});

describe('the glucose suppression test', () => {
  it('suppresses regulated GH below 1 in the normal axis', () => {
    const inputs = { ...DEFAULT_PITUITARY_INPUTS };
    let state = createInitialState();
    for (let t = 0; t < 20000; t += 0.2) state = step(state, inputs, 0.2).state;
    let s2 = perturbGlucoseLoad(state);
    for (let t = 0; t < 3600; t += 0.2) s2 = step(s2, inputs, 0.2).state;
    const during = computeDerived(s2, inputs);
    expect(during.glucoseSuppressionTest).toBe('suppressed (normal)');
    expect(during.ghNgMl).toBeLessThan(1);
  });

  it('fails to suppress an autonomous adenoma — the acromegaly screen', () => {
    const inputs = { ...DEFAULT_PITUITARY_INPUTS, ...PITUITARY_PRESETS.acromegaly };
    let state = createInitialState();
    for (let t = 0; t < 60000; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);

    let challenged = perturbGlucoseLoad(state);
    for (let t = 0; t < 3600; t += 0.2) challenged = step(challenged, inputs, 0.2).state;
    const during = computeDerived(challenged, inputs);

    expect(during.glucoseSuppressionTest).toBe('fails to suppress');
    expect(during.ghNgMl).toBeGreaterThan(before.ghNgMl * 0.95);
  });
});

describe('GH excess syndromes', () => {
  it('gives acromegaly: autonomous GH, high IGF-1 and accruing acral overgrowth', () => {
    const d = settle({ ...PITUITARY_PRESETS.acromegaly }, 900000);
    expect(d.ghNgMl).toBeGreaterThan(10);
    expect(d.igf1NgMl).toBeGreaterThan(320);
    expect(d.acromegalicIndex).toBeGreaterThan(30);
    expect(d.classification).toBe('acromegaly (GH adenoma)');
  }, 20000);

  it('converts the same excess into gigantism when epiphyses are open', () => {
    const d = settle({ ...PITUITARY_PRESETS.gigantism }, 900000);
    expect(d.classification).toBe('gigantism: GH excess, open epiphyses');
    expect(d.heightVelocityCmPerYear).toBeGreaterThan(8);
    expect(d.acromegalicIndex).toBeLessThan(40);
  }, 30000);
});

describe('hyperprolactinaemia mechanisms', () => {
  it('shows a macroprolactinoma with very high prolactin, suppressed gonads and field loss', () => {
    const d = settle(PITUITARY_PRESETS.macroprolactinoma);
    expect(d.prolactinNgMl).toBeGreaterThan(250);
    expect(d.gonadalSuppressionPct).toBeGreaterThan(80);
    expect(d.visualFieldDefectPct).toBeGreaterThan(20);
    expect(d.classification).toBe('macroprolactinoma');
  });

  it('shrinks a prolactinoma and restores braking under bromocriptine', () => {
    const inputs = { ...DEFAULT_PITUITARY_INPUTS, ...PITUITARY_PRESETS.macroprolactinoma };
    let state = createInitialState();
    for (let t = 0; t < 100000; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);

    let treated = perturbBromocriptineDose(state);
    for (let t = 0; t < 500000; t += 0.2) treated = step(treated, inputs, 0.2).state;
    const after = computeDerived(treated, inputs);
    expect(after.prolactinNgMl).toBeLessThan(before.prolactinNgMl / 3);
    expect(after.totalMassCc).toBeLessThan(before.totalMassCc);
  });

  it('lifts prolactin MODERATELY via D2 blockade with no mass at all', () => {
    const d = settle(PITUITARY_PRESETS.antipsychoticHyperprl);
    expect(d.prolactinNgMl).toBeGreaterThan(45);
    expect(d.prolactinNgMl).toBeLessThan(160);
    expect(d.totalMassCc).toBeLessThan(0.1);
    expect(d.classification).toBe('drug-induced hyperprolactinaemia');
  });

  it('uses TRH as the secretagogue in primary hypothyroidism', () => {
    const normalTrh = settle({ trhStimulusUnits: 10 }).prolactinNgMl;
    const hypothyroid = settle(PITUITARY_PRESETS.hypothyroidHyperprl);
    expect(hypothyroid.prolactinNgMl).toBeGreaterThan(normalTrh + 15);
    expect(hypothyroid.prolactinNgMl).toBeLessThan(120);
    expect(hypothyroid.classification).toContain('TRH-driven');
  }, 15000);

  it('produces only a mild stalk-effect rise from a NON-functioning mass, with field loss', () => {
    const d = settle(PITUITARY_PRESETS.nonFunctioningMass);
    expect(d.visualFieldDefectPct).toBeGreaterThan(60);
    expect(d.prolactinNgMl).toBeGreaterThan(25);
    expect(d.prolactinNgMl).toBeLessThan(120);
    expect(d.classification).toBe('non-functioning macroadenoma');
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<PituitaryInputs>[] = [
      { ghAdenomaSecretion: 100, dopamineTonePct: 0 },
      { prolactinomaSecretion: 100, d2ReceptorBlockPct: 100 },
      { nonfunctioningMass: 100, trhStimulusUnits: 100 },
      { ghAdenomaSecretion: 50, epiphysesOpen: 1, trhStimulusUnits: 0 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 60000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.prolactinNgMl).toBeGreaterThan(0);
      expect(d.prolactinNgMl).toBeLessThan(1300);
    }
  });
});
