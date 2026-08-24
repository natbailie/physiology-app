import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbStentObstruction, step } from './engine';
import { DEFAULT_LIVER_INPUTS, LIVER_PRESETS } from './presets';
import type { LiverDerived, LiverInputs } from './types';

function settle(patch: Partial<LiverInputs>, seconds = 250000): LiverDerived {
  const inputs = { ...DEFAULT_LIVER_INPUTS, ...patch };
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
  it('holds a healthy adult under the jaundice threshold with no bilirubinuria', () => {
    const d = settle(LIVER_PRESETS.normal);
    expect(d.totalBilirubinUmolL).toBeLessThan(17);
    expect(d.urineBilirubinPresent).toBe(false);
    expect(d.stoolColourPct).toBeGreaterThan(80);
    expect(d.classification).toBe('normal bile pigment handling');
    expect(d.lftPattern).toBe('normal');
  });
});

describe('unconjugated patterns', () => {
  it("keeps Gilbert's mild, unconjugated and enzyme-silent", () => {
    const d = settle(LIVER_PRESETS.gilbert);
    expect(d.unconjugatedUmolL).toBeGreaterThan(12);
    expect(d.conjugatedUmolL).toBeLessThan(8);
    expect(d.fractionConjugatedPct).toBeLessThan(35);
    expect(d.altXUlN).toBeLessThan(2);
    expect(d.alpXUlN).toBeLessThan(2);
    expect(d.urineBilirubinPresent).toBe(false);
    expect(d.classification).toContain('Gilbert');
  });

  it('reaches dangerous unconjugated levels in Crigler-Najjar I', () => {
    const d = settle(LIVER_PRESETS.criglerNajjar);
    expect(d.unconjugatedUmolL).toBeGreaterThan(80);
    expect(d.kernicterusRiskPct).toBeGreaterThan(60);
    expect(d.classification).toContain('Crigler-Najjar');
  });

  it('shows haemolysis as unconjugated rise with HIGH urobilinogen and no bilirubinuria', () => {
    const d = settle(LIVER_PRESETS.haemolyticAnaemia);
    expect(d.unconjugatedUmolL).toBeGreaterThan(20);
    expect(d.urineUrobilinogenIndex).toBeGreaterThan(250);
    expect(d.urineBilirubinPresent).toBe(false);
    expect(d.lftPattern).toBe('normal');
    expect(d.classification).toContain('haemolytic');
  });

  it('makes neonatal jaundice albumin-limited: same bilirubin is riskier on less albumin', () => {
    const neonate = settle(LIVER_PRESETS.neonatalPhysiological);
    const adultEquivalent = settle({ ...LIVER_PRESETS.neonatalPhysiological, albuminGPerL: 42 });
    expect(neonate.kernicterusRiskPct).toBeGreaterThan(adultEquivalent.kernicterusRiskPct * 1.15);
    expect(neonate.unconjugatedUmolL).toBeGreaterThan(25);
  });
});

describe('hepatocellular injury', () => {
  it('gives ALT-dominant enzymes with BOTH pigments regurgitating into plasma', () => {
    const d = settle(LIVER_PRESETS.acuteHepatitisA);
    expect(d.altXUlN).toBeGreaterThan(10);
    expect(d.rFactor).toBeGreaterThan(5);
    expect(d.lftPattern).toBe('hepatocellular');
    // Conjugated pigment reaches plasma directly through the damaged canaliculi.
    expect(d.conjugatedUmolL).toBeGreaterThan(6);
    expect(d.urineBilirubinPresent).toBe(true);
    expect(d.classification).toBe('hepatocellular jaundice');
  });
});

describe('cholestasis and obstruction', () => {
  it('shows conjugated-predominant jaundice with dark urine, absent urobilinogen, pale stool', () => {
    const d = settle(LIVER_PRESETS.choledocholithiasis);
    expect(d.fractionConjugatedPct).toBeGreaterThan(55);
    expect(d.totalBilirubinUmolL).toBeGreaterThan(40);
    expect(d.urineBilirubinPresent).toBe(true);
    expect(d.urineUrobilinogenIndex).toBeLessThan(30);
    expect(d.stoolColourPct).toBeLessThan(30);
    expect(d.alpXUlN).toBeGreaterThan(4);
    expect(d.classification).toBe('cholestatic / obstructive jaundice');
  });

  it('relieves obstruction after stenting, then conjugated bilirubin clears renally', () => {
    const inputs = { ...DEFAULT_LIVER_INPUTS, ...LIVER_PRESETS.choledocholithiasis };
    let state = createInitialState();
    for (let t = 0; t < 40000; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);

    let stented = perturbStentObstruction(state);
    for (let t = 0; t < 60000; t += 0.2) stented = step(stented, inputs, 0.2).state;
    const after = computeDerived(stented, inputs);
    expect(after.effectiveObstructionPct).toBeLessThan(before.effectiveObstructionPct);
    expect(after.conjugatedUmolL).toBeLessThan(before.conjugatedUmolL);
    expect(after.stoolColourPct).toBeGreaterThan(before.stoolColourPct);
  });
});

describe('decompensated cirrhosis', () => {
  it('raises ammonia into encephalopathy range when excretory mass fails', () => {
    const d = settle(LIVER_PRESETS.alcoholicCirrhosis);
    expect(d.ammoniaUmolL).toBeGreaterThan(90);
    expect(d.encephalopathyGrade).toBeGreaterThanOrEqual(2);
    expect(d.albuminGPerL).toBeLessThan(30);
    expect(d.classification).toBe('decompensated cirrhosis with encephalopathy');
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<LiverInputs>[] = [
      { haemolysisMultiplier: 8, ugtActivity: 0 },
      { hepatocyteExcretionPct: 0, hepatocyteInjuryPct: 100 },
      { biliaryObstructionPct: 100, albuminGPerL: 20 },
      { ugtActivity: 1, hepatocyteExcretionPct: 100, biliaryObstructionPct: 50, haemolysisMultiplier: 6 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 30000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.totalBilirubinUmolL).toBeLessThan(1200);
      expect(d.conjugatedUmolL).toBeGreaterThanOrEqual(0);
    }
  });
});
