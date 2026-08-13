import { describe, expect, it } from 'vitest';
import { autoregulation, urineOutput, reabsorptionFraction } from './renal';

describe('autoregulation', () => {
  it('is flat at 1.0 within the normal MAP band', () => {
    expect(autoregulation(70)).toBeCloseTo(1, 5);
    expect(autoregulation(93)).toBeCloseTo(1, 5);
    expect(autoregulation(150)).toBeCloseTo(1, 5);
  });

  it('falls off below the normal band (hypoperfusion)', () => {
    expect(autoregulation(50)).toBeLessThan(1);
    expect(autoregulation(30)).toBeLessThan(autoregulation(50));
    expect(autoregulation(20)).toBeCloseTo(0, 5);
  });

  it('rises modestly above the normal band (autoregulatory breakthrough)', () => {
    expect(autoregulation(180)).toBeGreaterThan(1);
  });
});

describe('urineOutput / reabsorptionFraction', () => {
  it('matches the baseline intake target at baseline GFR and reabsorption', () => {
    const reabsorption = reabsorptionFraction(0, 0);
    const urine = urineOutput(100, reabsorption);
    expect(urine).toBeCloseTo(100, 0);
  });

  it('drops as aldosterone (reabsorption) rises', () => {
    const low = urineOutput(100, reabsorptionFraction(0.1, 0));
    const baseline = urineOutput(100, reabsorptionFraction(0, 0));
    expect(low).toBeLessThan(baseline);
  });

  it('rises as ANP-driven natriuresis increases', () => {
    const boosted = urineOutput(100, reabsorptionFraction(0, 0.1));
    const baseline = urineOutput(100, reabsorptionFraction(0, 0));
    expect(boosted).toBeGreaterThan(baseline);
  });
});
