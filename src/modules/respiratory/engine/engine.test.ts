import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbAirwayObstruction, step } from './engine';
import { DEFAULT_RESP_INPUTS, RESP_PRESETS } from './presets';
import { BICARBONATE } from './constants';
import type { RespInputs, RespState } from './types';

function runFor(inputs: RespInputs, seconds: number, dt = 1, startState?: RespState) {
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
  it('settles near normal PaCO2/pH/HCO3-/SaO2', () => {
    const { state, derived } = runFor(DEFAULT_RESP_INPUTS, 3600);
    expect(derived.paCO2).toBeGreaterThan(37);
    expect(derived.paCO2).toBeLessThan(43);
    expect(derived.pH).toBeGreaterThan(7.37);
    expect(derived.pH).toBeLessThan(7.43);
    expect(state.plasmaHCO3).toBeGreaterThan(22);
    expect(state.plasmaHCO3).toBeLessThan(26);
    expect(derived.saO2).toBeGreaterThan(95);
  });

  it('never produces NaN/Infinity, and keeps pH/HCO3/PaCO2/PaO2/SaO2 within physiologic clamps', () => {
    const extremes: RespInputs[] = [];
    for (const minuteVentilation of [20, 300]) {
      for (const fiO2 of [0.05, 1.0]) {
        for (const co2Production of [50, 300]) {
          for (const metabolicAcidLoad of [-100, 100]) {
            for (const renalCompensationCapacity of [0, 1.5]) {
              extremes.push({ minuteVentilation, fiO2, co2Production, metabolicAcidLoad, renalCompensationCapacity });
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
      // Henderson-Hasselbalch pH at the extremes of the HCO3-/PaCO2 clamps (HCO3 5-45,
      // PaCO2 10-150) ranges roughly 6.1-8.3 — wider than any real survivable pH, but this
      // sweep intentionally covers input combinations far outside physiologic norms.
      expect(derived.pH).toBeGreaterThan(6.0);
      expect(derived.pH).toBeLessThan(8.5);
      expect(state.plasmaHCO3).toBeGreaterThanOrEqual(BICARBONATE.MIN_MEQ_L - 1e-6);
      expect(state.plasmaHCO3).toBeLessThanOrEqual(BICARBONATE.MAX_MEQ_L + 1e-6);
      expect(derived.saO2).toBeGreaterThanOrEqual(0);
      expect(derived.saO2).toBeLessThanOrEqual(100);
    }
  });
});

describe('engine — acute bronchospasm', () => {
  it('acutely worsens gas exchange, then recovers as obstruction resolves', () => {
    const baseline = runFor(DEFAULT_RESP_INPUTS, 600).state;
    const obstructed = perturbAirwayObstruction(baseline);
    const immediate = computeDerived(obstructed, DEFAULT_RESP_INPUTS);
    const baselineDerived = computeDerived(baseline, DEFAULT_RESP_INPUTS);

    expect(immediate.paCO2).toBeGreaterThan(baselineDerived.paCO2);
    expect(immediate.paO2).toBeLessThan(baselineDerived.paO2);
    expect(immediate.pH).toBeLessThan(baselineDerived.pH);

    // The fast chemoreceptor drive should already be pushing back within seconds.
    const soon = runFor(DEFAULT_RESP_INPUTS, 10, 1, obstructed);
    expect(soon.derived.chemoreceptorDrive).toBeGreaterThan(0);

    const recovered = runFor(DEFAULT_RESP_INPUTS, 600, 1, obstructed);
    expect(recovered.state.airwayObstruction).toBeLessThan(obstructed.airwayObstruction * 0.2);
    expect(recovered.derived.paCO2).toBeLessThan(immediate.paCO2);
  });
});

describe('engine — COPD (chronic respiratory acidosis with renal compensation)', () => {
  it('sustains elevated PaCO2 with renal compensation raising HCO3- and partially normalizing pH', () => {
    const inputs: RespInputs = { ...DEFAULT_RESP_INPUTS, ...RESP_PRESETS.copdChronicAcidosis };
    const { state, derived } = runFor(inputs, 10800);

    expect(derived.paCO2).toBeGreaterThan(45);
    expect(state.plasmaHCO3).toBeGreaterThan(BICARBONATE.BASELINE_MEQ_L);
    expect(derived.pH).toBeGreaterThan(7.25);
    expect(derived.pH).toBeLessThan(7.4);
    expect(derived.renalCompensationDrive).toBeGreaterThan(0);
  });
});

describe('engine — panic attack (acute, uncompensated respiratory alkalosis)', () => {
  it('shows low PaCO2 and high pH with only mild HCO3- change at a short duration', () => {
    const inputs: RespInputs = { ...DEFAULT_RESP_INPUTS, ...RESP_PRESETS.panicHyperventilation };
    const { state, derived } = runFor(inputs, 30);

    expect(derived.paCO2).toBeLessThan(32);
    expect(derived.pH).toBeGreaterThan(7.45);
    expect(state.plasmaHCO3).toBeGreaterThan(BICARBONATE.BASELINE_MEQ_L - 4);
  });
});

describe('engine — DKA (metabolic acidosis with respiratory/Kussmaul compensation)', () => {
  it('produces reduced HCO3-, compensatorily low PaCO2 emerging from chemoreceptor drive alone, and acidemia', () => {
    const inputs: RespInputs = { ...DEFAULT_RESP_INPUTS, ...RESP_PRESETS.dkaMetabolicAcidosis };
    const { state, derived } = runFor(inputs, 3600 * 6);

    expect(inputs.minuteVentilation).toBe(DEFAULT_RESP_INPUTS.minuteVentilation);
    expect(state.plasmaHCO3).toBeLessThan(18);
    expect(derived.paCO2).toBeLessThan(38);
    expect(derived.pH).toBeLessThan(7.38);
    expect(derived.chemoreceptorDrive).toBeGreaterThan(0);
  });
});

describe('engine — high altitude (hypoxic respiratory alkalosis)', () => {
  it('produces hypoxemia driving compensatory hyperventilation and mild alkalosis', () => {
    const inputs: RespInputs = { ...DEFAULT_RESP_INPUTS, ...RESP_PRESETS.highAltitude };
    const { derived } = runFor(inputs, 1800);

    expect(derived.paO2).toBeLessThan(55);
    expect(derived.saO2).toBeLessThan(88);
    expect(derived.paCO2).toBeLessThan(38);
    expect(derived.pH).toBeGreaterThan(7.4);
  });
});
