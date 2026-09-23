import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState } from './engine';
import { DEFAULT_TOXICOLOGY_INPUTS, TOXICOLOGY_PRESETS } from './presets';
import type { ToxicologyDerived, ToxicologyInputs } from './types';

type Preset = keyof typeof TOXICOLOGY_PRESETS;

function derivedWith(inputs: Partial<ToxicologyInputs>): ToxicologyDerived {
  return computeDerived(createInitialState(), { ...DEFAULT_TOXICOLOGY_INPUTS, ...inputs });
}

describe('toxicology engine', () => {
  it('reads the UK 75 mg/kg treatment threshold off the baseline', () => {
    const d = derivedWith({});
    expect(d.absorbedDoseMgPerKg).toBe(75);
    expect(d.plasmaMgL).toBeCloseTo(37.5, 1);
    expect(d.nomogramLineMgL).toBeCloseTo(100, 1);
    expect(d.nomogramRatio).toBeLessThan(1);
    expect(d.hepatotoxicityRisk).toBe(0);
  });

  it('sends a massive untreated dose far above the nomogram line', () => {
    const d = derivedWith({ doseMgKg: 400, hoursSinceIngestion: 2, nacStartHours: 99 });
    expect(d.nomogramRatio).toBeGreaterThan(1.5);
    expect(d.hepatotoxicityRisk).toBeGreaterThan(0.8);
    expect(d.state).toBe('High risk');
  });

  it('lets NAC within eight hours almost clear the risk of a big overdose', () => {
    const untreated = derivedWith({ doseMgKg: 300, hoursSinceIngestion: 2, nacStartHours: 99 });
    const withNac = derivedWith({ doseMgKg: 300, hoursSinceIngestion: 2, nacStartHours: 2 });
    expect(withNac.hepatotoxicityRisk).toBeLessThan(untreated.hepatotoxicityRisk / 3);
  });

  it('keeps most of the protection when NAC is started at the hour of presentation rather than pushed off', () => {
    const givenNow = derivedWith({ doseMgKg: 400, hoursSinceIngestion: 4, nacStartHours: 4 });
    const deferred = derivedWith({ doseMgKg: 400, hoursSinceIngestion: 4, nacStartHours: 20 });
    expect(givenNow.nacProtection).toBeGreaterThan(deferred.nacProtection);
    expect(deferred.hepatotoxicityRisk).toBeGreaterThan(givenNow.hepatotoxicityRisk);
  });

  it('lets charcoal within the first hours sequester a large share of the load', () => {
    const without = derivedWith({ doseMgKg: 300, hoursSinceIngestion: 1, charcoalDosePct: 0 });
    const charcoalGiven = derivedWith({ doseMgKg: 300, hoursSinceIngestion: 1, charcoalDosePct: 40 });
    expect(charcoalGiven.charcoalReductionPct).toBe(40);
    expect(charcoalGiven.plasmaMgL).toBeLessThan(without.plasmaMgL * 0.8);
  });

  it('closes the antidote window as the hours pass', () => {
    expect(derivedWith({ hoursSinceIngestion: 2 }).antidoteWindowHours).toBe(6);
    expect(derivedWith({ hoursSinceIngestion: 8 }).antidoteWindowHours).toBe(0);
    expect(derivedWith({ hoursSinceIngestion: 26 }).antidoteWindowHours).toBe(0);
  });

  it('knows once the clock has run past the window', () => {
    const d = derivedWith({ hoursSinceIngestion: 26, nacStartHours: 26 });
    expect(d.state).toBe('Past the window');
  });

  it('never produces NaN across extreme inputs', () => {
    const extremes: Partial<ToxicologyInputs>[] = [
      { doseMgKg: 0, hoursSinceIngestion: 0, charcoalDosePct: 0, nacStartHours: 0 },
      { doseMgKg: 500, hoursSinceIngestion: 24, charcoalDosePct: 50, nacStartHours: 24 },
      { doseMgKg: 500, hoursSinceIngestion: 24, charcoalDosePct: 50, nacStartHours: 99 },
      { doseMgKg: 0, hoursSinceIngestion: 24, charcoalDosePct: 0, nacStartHours: 0 },
    ];
    for (const patch of extremes) {
      const d = derivedWith(patch);
      const readings = [
        d.plasmaMgL,
        d.nomogramLineMgL,
        d.nomogramRatio,
        d.absorbedDoseMgPerKg,
        d.hepatotoxicityRisk,
        d.antidoteWindowHours,
        d.charcoalReductionPct,
        d.nacProtection,
      ];
      for (const value of readings) expect(Number.isFinite(value)).toBe(true);
    }
  });

  it('every shipped preset settles to the state its label promises', () => {
    const expectations: Record<Preset, string> = {
      thresholdDose: 'Low risk — protected',
      earlyMassiveDose: 'Above the line',
      latePresentation: 'Low risk — protected',
      missedWindow: 'Past the window',
      safeExposure: 'Sub-toxic',
      charcoalWins: 'Above the line',
    };
    for (const preset of Object.keys(TOXICOLOGY_PRESETS) as Preset[]) {
      const d = computeDerived(createInitialState(), TOXICOLOGY_PRESETS[preset]);
      expect(d.state, `${preset} should read ${expectations[preset]}, got ${d.state}`).toBe(expectations[preset]);
    }
  });
});