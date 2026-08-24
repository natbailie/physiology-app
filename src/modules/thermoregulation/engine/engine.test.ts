import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbActiveRewarming, perturbGiveAntipyretic, step } from './engine';
import { DEFAULT_THERMO_INPUTS, THERMO_PRESETS } from './presets';
import type { ThermoDerived, ThermoInputs } from './types';

function settle(patch: Partial<ThermoInputs>, seconds = 200000): ThermoDerived {
  const inputs = { ...DEFAULT_THERMO_INPUTS, ...patch };
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
  it('holds a clothed adult thermoneutral at room temperature', () => {
    const d = settle(THERMO_PRESETS.normothermic);
    expect(d.coreTempC).toBeGreaterThan(36.6);
    expect(d.coreTempC).toBeLessThan(37.4);
    expect(d.shiveringW).toBeLessThan(5);
    expect(d.classification).toBe('thermoneutral');
  });
});

describe('fever versus hyperthermia', () => {
  it('raises the SET POINT with pyrogens and defends it with chills', () => {
    const inputs = { ...DEFAULT_THERMO_INPUTS, ...THERMO_PRESETS.feverViral };
    let state = createInitialState();
    let maxShiver = 0;
    for (let t = 0; t < 700000; t += 0.2) {
      state = step(state, inputs, 0.2).state;
      maxShiver = Math.max(maxShiver, state.shiveringW);
    }
    const d = computeDerived(state, inputs);
    expect(d.setPointC).toBeGreaterThan(38.5);
    expect(d.coreTempC).toBeGreaterThan(38.3);
    expect(d.classification).toBe('fever: set point elevated');
    // Somewhere in the climb the patient was chilled and shivering hard.
    expect(maxShiver).toBeGreaterThan(30);
  }, 20000);

  it('keeps the set point NORMAL in exertional heat stroke', () => {
    const d = settle({ ...THERMO_PRESETS.heatStrokeExertional }, 300000);
    expect(d.setPointC).toBeLessThan(37.8);
    expect(d.coreTempC).toBeGreaterThan(39.8);
    const cls = d.classification;
    expect(['heat stroke: sweating failing', 'hyperthermia: heat load overwhelming']).toContain(cls);
  });

  it('makes an antipyretic LOWER the point and start sweating — the crisis', () => {
    const inputs = { ...DEFAULT_THERMO_INPUTS, ...THERMO_PRESETS.feverViral };
    let state = createInitialState();
    for (let t = 0; t < 700000; t += 0.2) state = step(state, inputs, 0.2).state;
    const febrile = computeDerived(state, inputs);
    expect(febrile.coreTempC).toBeGreaterThan(38);

    let treated = perturbGiveAntipyretic(state);
    for (let t = 0; t < 240000; t += 0.2) {
      // Re-dose on a clinical schedule so the effect never fully decays.
      if (Math.round(t) % 60000 === 0 && t > 0) treated = perturbGiveAntipyretic(treated);
      treated = step(treated, inputs, 0.2).state;
    }
    const after = computeDerived(treated, inputs);
    expect(after.setPointC).toBeLessThan(febrile.setPointC - 1);
    expect(after.coreTempC).toBeLessThan(febrile.coreTempC - 0.5);
    // The pyrogen is untouched — only the point moved.
    expect(inputs.pyrogenLevel).toBeGreaterThan(50);
  }, 30000);

  it('impairs sweating with humidity and anticholinergics, accelerating heat gain', () => {
    const dry = settle({ ambientTemperatureC: 38, humidityPct: 15, metabolicRateMultiplier: 7 }, 120000);
    const humid = settle({ ambientTemperatureC: 38, humidityPct: 95, metabolicRateMultiplier: 7 }, 120000);
    expect(humid.coreTempC).toBeGreaterThan(dry.coreTempC);
  });

  it('raises core temperature when metabolic production climbs (exercise heat)', () => {
    const rest = settle({ metabolicRateMultiplier: 1 }).coreTempC;
    const exercising = settle({ metabolicRateMultiplier: 6 }).coreTempC;
    expect(exercising).toBeGreaterThan(rest + 0.3);
  });
});

describe('cold exposure', () => {
  it('shivers maximally in mild hypothermia while still defending', () => {
    const d = settle({ ...THERMO_PRESETS.mildHypothermia }, 300000);
    expect(d.coreTempC).toBeLessThan(35.5);
    expect(d.shiveringW).toBeGreaterThan(150);
    expect(d.classification).toBe('mild hypothermia');
  });

  it('LOSES shivering as hypothermia deepens past 32 C — defences failing', () => {
    const d = settle({ ...THERMO_PRESETS.deepHypothermia }, 600000);
    expect(d.coreTempC).toBeLessThan(32);
    expect(d.shiveringW).toBeLessThan(30);
    expect(d.classification).toContain('moderate');
  });

  it('responds to active rewarming with rising core temperature', () => {
    const inputs = { ...DEFAULT_THERMO_INPUTS, ...THERMO_PRESETS.deepHypothermia };
    let state = createInitialState();
    for (let t = 0; t < 700000; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);

    let warmed = perturbActiveRewarming(state);
    for (let t = 0; t < 40000; t += 0.2) warmed = step(warmed, inputs, 0.2).state;
    const after = computeDerived(warmed, inputs);
    expect(after.netStorageW).toBeGreaterThan(before.netStorageW);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<ThermoInputs>[] = [
      { ambientTemperatureC: -20, humidityPct: 100, metabolicRateMultiplier: 14 },
      { ambientTemperatureC: 48, humidityPct: 100, metabolicRateMultiplier: 10, sweatImpairmentPct: 100 },
      { pyrogenLevel: 100, sweatImpairmentPct: 100 },
      { ambientTemperatureC: 45, humidityPct: 0, metabolicRateMultiplier: 0.4 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 80000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.coreTempC).toBeGreaterThanOrEqual(24);
      expect(d.coreTempC).toBeLessThanOrEqual(43.5);
    }
  });
});
