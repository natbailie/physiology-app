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

// --- Haemolytic disease of the newborn ---

/** Fast settle for the fetal arm: its timescale is weeks, so step in hour chunks. */
function settleFetal(patch: Partial<BloodInputs>, seconds = 1_800_000): BloodDerived {
  const inputs = { ...DEFAULT_BLOOD_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 3600);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

const HDN_BASE = { hdnScenario: 1, recipientRhPositive: 0, fetusRhPositive: 1 } as Partial<BloodInputs>;

describe('HDN — haemolytic disease of the newborn', () => {
  it('a sensitised Rh− mother with a Rh+ fetus slowly anaemises that fetus', () => {
    const affected = settleFetal({ ...HDN_BASE, rhSensitised: 1 });

    expect(affected.reactionArm).toBe('fetal haemolysis (maternal IgG)');
    expect(affected.fetalHaemoglobinGDl).toBeLessThan(10);
    expect(affected.cordBilirubinUmolL).toBeGreaterThan(100);
    expect(affected.hydropsRiskPct).toBeGreaterThan(0);
    // The mother was already sensitised — there is nothing left for anti-D to prevent.
    expect(affected.nextPregnancySensitisationRiskPct).toBe(0);
  });

  it('anti-D protects only before sensitisation: this baby fine, next pregnancy primed', () => {
    const protectedCase = settleFetal({ ...HDN_BASE, rhSensitised: 0, antiDProtectionPct: 95 });
    const missedCase = settleFetal({ ...HDN_BASE, rhSensitised: 0, antiDProtectionPct: 0 });

    // Both fetuses escape THIS pregnancy — sensitisation happens at a delivery.
    expect(protectedCase.fetalHaemoglobinGDl).toBeGreaterThan(14);
    expect(missedCase.fetalHaemoglobinGDl).toBeGreaterThan(14);
    // The entire difference is what happens NEXT time.
    expect(protectedCase.nextPregnancySensitisationRiskPct).toBeLessThan(10);
    expect(missedCase.nextPregnancySensitisationRiskPct).toBeGreaterThan(90);
  });

  it('giving anti-D after sensitisation changes nothing', () => {
    const untreated = settleFetal({ ...HDN_BASE, rhSensitised: 1 }, 3_600_000);
    const treatedLate = settleFetal({ ...HDN_BASE, rhSensitised: 1, antiDProtectionPct: 95 }, 3_600_000);

    // The antibody already exists; prophylaxis is prevention, never treatment.
    expect(treatedLate.fetalHaemoglobinGDl).toBeCloseTo(untreated.fetalHaemoglobinGDl, 1);
  });

  it('an Rh-negative fetus is never affected regardless of maternal antibody', () => {
    const negativeFetus = settleFetal({ ...HDN_BASE, rhSensitised: 1, fetusRhPositive: 0 });

    expect(negativeFetus.fetalHaemoglobinGDl).toBeCloseTo(15, 1);
    expect(negativeFetus.cordBilirubinUmolL).toBe(0);
  });
});
