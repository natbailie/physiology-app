import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_RF_INPUTS, RF_PRESETS } from './presets';
import type { RfInputs, RfState } from './types';

const DT = 0.01;

function settle(inputs: RfInputs, seconds = 5): RfState {
  let state = createInitialState();
  for (let i = 0; i < seconds / DT; i++) state = step(state, inputs, DT).state;
  return state;
}

function settled(name: keyof typeof RF_PRESETS, overrides: Partial<RfInputs> = {}) {
  const inputs: RfInputs = { ...DEFAULT_RF_INPUTS, ...RF_PRESETS[name], ...overrides };
  return computeDerived(settle(inputs), inputs);
}

describe('engine — the calibrated normal baseline', () => {
  it('opens on textbook gas exchange and no respiratory failure', () => {
    const derived = settled('normal');

    expect(derived.paO2).toBeGreaterThan(80);
    expect(derived.paO2).toBeLessThan(100);
    expect(derived.paCO2).toBeGreaterThan(35);
    expect(derived.paCO2).toBeLessThan(45);
    expect(derived.saO2).toBeGreaterThan(95);
    expect(derived.pH).toBeGreaterThan(7.35);
    expect(derived.pH).toBeLessThan(7.45);
    expect(derived.plasmaHCO3).toBeGreaterThan(22);
    expect(derived.plasmaHCO3).toBeLessThan(26);
    expect(derived.alveolarVentilationMLPerMin).toBeCloseTo(4200, -2);
    expect(derived.failureType).toBe('none');
    expect(derived.hypoxaemia).toBe('none');
    expect(derived.respiratoryAcidosis).toBe(false);
  });

  it('never produces NaN/Infinity across extreme settings', () => {
    const extremes: RfInputs[] = [];
    for (const fiO2 of [0.21, 0.5, 1]) {
      for (const minuteVentilation of [2, 6, 20]) {
        for (const shuntFraction of [0, 0.02, 0.6]) {
          for (const co2ProductionMultiplier of [0.5, 1, 3]) {
            for (const course of ['acute', 'chronic'] as const) {
              extremes.push({ ...DEFAULT_RF_INPUTS, fiO2, minuteVentilation, shuntFraction, co2ProductionMultiplier, course });
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const derived = computeDerived(settle(inputs, 3), inputs);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      expect(derived.paCO2).toBeGreaterThan(5);
      expect(derived.paCO2).toBeLessThan(451);
      expect(derived.paO2).toBeGreaterThanOrEqual(4);
      expect(derived.paO2).toBeLessThan(712);
      expect(derived.saO2).toBeGreaterThan(0);
      expect(derived.saO2).toBeLessThanOrEqual(100);
    }
  });
});

describe('engine — type I: hypoxic failure driven by shunt', () => {
  it('classifies shunt-predominant pneumonia as type I with severe hypoxaemia', () => {
    const derived = settled('type1Pneumonia');

    expect(derived.effectiveShuntFraction).toBeGreaterThan(0.2);
    expect(derived.paO2).toBeLessThan(60);
    expect(derived.hypoxaemia).toBe('severe');
    expect(derived.failureType).toBe('type 1');
    // Shunt drags down the A-a gradient — blood leaving unventilated lung is never oxygenated.
    expect(derived.aaGradient).toBeGreaterThan(30);
    // PaCO2 stays normal: shunt is an oxygen problem, not a CO2 one.
    expect(derived.paCO2).toBeGreaterThan(35);
    expect(derived.paCO2).toBeLessThan(45);
  });

  it('oxygen rescues hypoxic failure with low shunt but cannot touch hypoxic failure from a big shunt', () => {
    const pneumoniaHighShunt = settled('type1Pneumonia', { fiO2: 1 });
    // Even 100% oxygen cannot fully oxygenate blood that never saw an alveolus.
    expect(pneumoniaHighShunt.paO2).toBeGreaterThan(settled('type1Pneumonia').paO2);

    const mild = settled('normal', { shuntFraction: 0.03 });
    const mildO2 = settled('normal', { shuntFraction: 0.03, fiO2: 0.5 });
    expect(mildO2.paO2).toBeGreaterThan(mild.paO2 + 20);
  });
});

describe('engine — type II: hypercapnic failure from dead space', () => {
  it('chronic COPD under-ventilates into type II with kidney compensation buying time', () => {
    const derived = settled('type2ChronicCopd');

    expect(derived.paCO2).toBeGreaterThan(55);
    expect(derived.failureType).toBe('type 2');
    expect(derived.respiratoryAcidosis).toBe(true);
    // Chronic compensation: bicarbonate is high, so the pH is only mildly acidotic.
    expect(derived.plasmaHCO3).toBeGreaterThan(30);
    expect(derived.pH).toBeGreaterThan(7.2);
    expect(derived.pH).toBeLessThan(7.45);
  });

  it('an acute exacerbation is more acidotic than the same hypercapnia with chronic compensation', () => {
    const acute = settled('type2Neuromuscular');
    const chronic = settled('type2ChronicCopd');

    // Both are hypercapnic, but the chronic kidney has been buying time.
    expect(chronic.plasmaHCO3).toBeGreaterThan(acute.plasmaHCO3);
    expect(chronic.pH).toBeGreaterThan(acute.pH);
  });

  it('raising minute ventilation blows off CO2 and clears hypercapnia', () => {
    const low = settled('type2Neuromuscular');
    const ventilated = settled('type2Neuromuscular', { minuteVentilation: 8 });

    expect(ventilated.paCO2).toBeLessThan(low.paCO2 - 15);
    expect(ventilated.respiratoryAcidosis).toBe(false);
  });

  it('course is a deliberate tie at rest and separates the moment PaCO2 rises', () => {
    // A normal PaCO2 gives the kidney nothing to compensate, so acute and chronic must read
    // identically there — this is the anatomy of the controls-test allowlist entry below.
    const atRestAcute = settled('normal', { course: 'acute' });
    const atRestChronic = settled('normal', { course: 'chronic' });
    expect(atRestChronic.plasmaHCO3).toBeCloseTo(atRestAcute.plasmaHCO3, 9);
    expect(atRestChronic.pH).toBeCloseTo(atRestAcute.pH, 9);
    expect(atRestAcute.failureType).toBe('none');

    // Give the kidney something to compensate and the two courses separate sharply: chronic
    // retains bicarbonate, so the pH of the same hypercapnia is protected where acute is not.
    const acuteOnChronic = settled('type2CopdExacerbation', { course: 'chronic' });
    const acute = settled('type2CopdExacerbation', { course: 'acute' });
    expect(acute.plasmaHCO3).toBeLessThan(acuteOnChronic.plasmaHCO3 - 5);
    expect(acute.pH).toBeLessThan(acuteOnChronic.pH - 0.08);
    expect(acuteOnChronic.pH).toBeGreaterThan(7.3);
  });
});

describe('engine — mixed failure', () => {
  it('a large shunt and a low minute ventilation fail both at once', () => {
    const derived = settled('mixedSevere');

    expect(derived.paO2).toBeLessThan(60);
    expect(derived.paCO2).toBeGreaterThan(50);
    expect(derived.failureType).toBe('mixed');
  });

  it('shunt dominates the oxygen story and dead space the CO2 story independently', () => {
    const mixed = settled('mixedSevere');
    const deshunted = settled('mixedSevere', { shuntFraction: 0.02 });

    // Clearing the shunt fixes O2 but leaves the hypercapnia untouched.
    expect(deshunted.paO2).toBeGreaterThan(mixed.paO2 + 20);
    expect(deshunted.paCO2).toBeCloseTo(mixed.paCO2, 5);
  });
});