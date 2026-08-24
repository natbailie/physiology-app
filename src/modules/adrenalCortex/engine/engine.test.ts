import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_ADRENAL_INPUTS, ADRENAL_PRESETS } from './presets';
import type { AdrenalCortexDerived, AdrenalCortexInputs } from './types';

function settle(patch: Partial<AdrenalCortexInputs>, seconds = 60000): AdrenalCortexDerived {
  const inputs = { ...DEFAULT_ADRENAL_INPUTS, ...patch };
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
  it('holds an intact gland at reference flux', () => {
    const d = settle(ADRENAL_PRESETS.normal);
    expect(d.endogenousCortisol).toBeGreaterThan(85);
    expect(d.mineralocorticoidActivity).toBeGreaterThan(90);
    expect(d.androgens).toBeGreaterThan(85);
    expect(d.saltWasting).toBe(false);
    expect(d.classification).toBe('normal steroidogenesis');
  });
});

describe('21-hydroxylase deficiency', () => {
  it('loses cortisol AND aldosterone while androgens and 17-OHP soar', () => {
    const d = settle(ADRENAL_PRESETS.cah21SaltWasting);
    expect(d.effectiveCortisol).toBeLessThan(15);
    expect(d.aldosterone).toBeLessThan(15);
    expect(d.androgens).toBeGreaterThan(180);
    expect(d.marker17ohp).toBeGreaterThan(150);
    expect(d.saltWasting).toBe(true);
    expect(d.addisonianCrisisRiskPct).toBeGreaterThan(60);
    expect(d.classification).toContain('salt-wasting');
  });

  it('is rescued by replacement therapy without changing the block', () => {
    const d = settle(ADRENAL_PRESETS.cah21Treated);
    expect(d.saltWasting).toBe(false);
    expect(d.addisonianCrisisRiskPct).toBeLessThan(25);
    // The enzymatic block remains: endogenous production is still collapsed.
    expect(d.endogenousCortisol).toBeLessThan(20);
  });

  it('keeps enough residual enzyme in the simple-virilising form to avoid salt loss', () => {
    const d = settle(ADRENAL_PRESETS.cah21SimpleVirilising);
    expect(d.saltWasting).toBe(false);
    expect(d.androgens).toBeGreaterThan(120);
    expect(d.classification).toContain('simple virilising');
  });
});

describe('11β-hydroxylase deficiency', () => {
  it('accumulates DOC causing HYPERTENSION with high androgens and NO salt-wasting', () => {
    const d = settle(ADRENAL_PRESETS.cah11);
    expect(d.docExcess).toBeGreaterThan(100);
    expect(d.hypertensionFromDoc).toBe(true);
    expect(d.saltWasting).toBe(false);
    expect(d.androgens).toBeGreaterThan(140);
    expect(d.classification).toBe('11β-hydroxylase deficiency');
  });
});

describe('17α-hydroxylase deficiency', () => {
  it('removes androgens entirely while DOC drives hypertension', () => {
    const d = settle(ADRENAL_PRESETS.cah17);
    expect(d.androgens).toBeLessThan(25);
    expect(d.hypertensionFromDoc).toBe(true);
    expect(d.saltWasting).toBe(false);
    // Aldosterone is secondarily suppressed (renin shutdown under DOC hypertension).
    expect(d.aldosterone).toBeLessThan(60);
    expect(d.classification).toBe('17α-hydroxylase deficiency');
  });
});

describe('3β-HSD deficiency', () => {
  it('collapses everything downstream INCLUDING androgens, with LOW 17-OHP', () => {
    const d = settle(ADRENAL_PRESETS.cah3b);
    expect(d.effectiveCortisol).toBeLessThan(32);
    expect(d.androgens).toBeLessThan(35);
    expect(d.marker17ohp).toBeLessThan(25);
    expect(d.saltWasting).toBe(true);
    expect(d.classification).toBe('3β-HSD deficiency');
  });
});

describe('ACTH drive', () => {
  it('pushes androgen excess higher when the untreated gland is flogged', () => {
    const basal = settle({ block21Pct: 96 }).androgens;
    const driven = settle({ block21Pct: 96, acthDrivePct: 180 }).androgens;
    expect(driven).toBeGreaterThan(basal * 1.2);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<AdrenalCortexInputs>[] = [
      { acthDrivePct: 200, block21Pct: 100, block11Pct: 100 },
      { block17Pct: 100, block3bhsdPct: 100 },
      { replacementTherapyPct: 100, block21Pct: 100 },
      { acthDrivePct: 0, block17Pct: 50, block21Pct: 50 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 30000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.androgens).toBeGreaterThanOrEqual(0);
      expect(d.effectiveCortisol).toBeLessThanOrEqual(200);
    }
  });
});
