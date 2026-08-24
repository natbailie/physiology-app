import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_BLOOD_INPUTS, BLOOD_PRESETS } from './presets';
import { aboMajorIncompatible } from './bloodMechanics';
import type { BloodDerived, BloodInputs } from './types';

function settle(patch: Partial<BloodInputs>, seconds = 40000): BloodDerived {
  const inputs = { ...DEFAULT_BLOOD_INPUTS, ...patch };
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

describe('ABO compatibility logic', () => {
  it('marks the matrix correctly', () => {
    // O recipient has both antibodies — rejects everything except O.
    expect(aboMajorIncompatible(0, 1)).toBe(true);
    expect(aboMajorIncompatible(0, 3)).toBe(true);
    expect(aboMajorIncompatible(0, 2)).toBe(true);
    // AB recipient has neither antibody — universal red-cell recipient.
    expect(aboMajorIncompatible(3, 0)).toBe(false);
    expect(aboMajorIncompatible(3, 1)).toBe(false);
    expect(aboMajorIncompatible(3, 2)).toBe(false);
    // Same-type always fine; A→B and B→A both mismatch on A/B antigens.
    expect(aboMajorIncompatible(1, 1)).toBe(false);
    expect(aboMajorIncompatible(1, 2)).toBe(true);
    expect(aboMajorIncompatible(2, 1)).toBe(true);
  });

  it('leaves a matched unit completely silent', () => {
    const d = settle(BLOOD_PRESETS.compatibleMatch);
    expect(d.haemolyticSeverity).toBeLessThan(1);
    expect(d.plasmaFreeHaemoglobin).toBeLessThan(5);
    expect(d.classification).toBe('compatible transfusion');
  });
});

describe('the acute ABO reaction', () => {
  it('gives an A unit to an O patient with complement, free Hb and haemoglobinuria', () => {
    const d = settle(BLOOD_PRESETS.aToO);
    expect(d.haemolyticSeverity).toBeGreaterThan(25);
    expect(d.plasmaFreeHaemoglobin).toBeGreaterThan(50);
    expect(d.complementConsumedPct).toBeGreaterThan(40);
    expect(d.haemoglobinuriaPct).toBeGreaterThan(20);
    expect(d.classification).toBe('ABO-incompatible: acute haemolytic reaction');
  });

  it('scales disaster with volume: 500 mL is DIC and renal failure', () => {
    const d = settle(BLOOD_PRESETS.massiveMismatch, 80000);
    expect(d.dicRiskPct).toBeGreaterThan(60);
    expect(d.renalInjuryRiskPct).toBeGreaterThan(60);
    expect(d.shockIndex).toBeGreaterThan(0.7);
    expect(d.classification).toContain('DIC');
  });

  it('is FASTER than the Rh arm at the same nominal severity', () => {
    // ABO severity at 20 minutes far exceeds the Rh arm's at the same wall-clock settle.
    const abo = settle({ recipientAboIndex: 0, donorAboIndex: 1 }, 20000);
    const rh = settle(
      { recipientRhPositive: 0, donorRhPositive: 1, rhSensitised: 1 },
      20000,
    );
    expect(abo.haemolyticSeverity).toBeGreaterThan(rh.haemolyticSeverity * 3);
  });
});

describe('universal donor and recipient', () => {
  it('lets an AB patient take O red cells without any reaction', () => {
    const d = settle(BLOOD_PRESETS.abUniversal);
    expect(d.aboIncompatible).toBe(false);
    expect(d.haemolyticSeverity).toBeLessThan(1);
    expect(d.classification).toBe('compatible transfusion');
  });

  it('still kills an O patient given AB red cells', () => {
    const d = settle(BLOOD_PRESETS.oRecipientGetsAb, 80000);
    expect(d.aboIncompatible).toBe(true);
    expect(d.classification).toBe('ABO-incompatible: acute haemolytic reaction');
  });
});

describe('the delayed Rh reaction', () => {
  it('runs slowly in a sensitised recipient with little free Hb but real clearance', () => {
    const d = settle(BLOOD_PRESETS.rhSensitisedMismatch, 900000);
    expect(d.haemolyticSeverity).toBeGreaterThan(30);
    expect(d.plasmaFreeHaemoglobin).toBeLessThan(60);
    expect(d.complementConsumedPct).toBeLessThan(35);
    expect(d.classification).toBe('Rh-incompatible: delayed haemolytic reaction');
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<BloodInputs>[] = [
      { recipientAboIndex: 3, donorAboIndex: 0, transfusionVolumeMl: 500 },
      { recipientAboIndex: 0, donorAboIndex: 3, transfusionVolumeMl: 500, rhSensitised: 1 },
      { transfusionVolumeMl: 0, recipientRhPositive: 0, donorRhPositive: 1 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 60000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.haemolyticSeverity).toBeLessThanOrEqual(100);
    }
  });
});
