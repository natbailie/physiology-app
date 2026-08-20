import { describe, expect, it } from 'vitest';
import { t3Level, t4LevelTarget, conversionEfficiency } from './thyroidHormone';

describe('conversionEfficiency', () => {
  it('is full efficiency (1) when there is no illness signal', () => {
    expect(conversionEfficiency(0)).toBe(1);
  });

  it('falls as the illness signal rises, floored at MIN_EFFICIENCY', () => {
    const mild = conversionEfficiency(0.3);
    const severe = conversionEfficiency(1);
    expect(mild).toBeLessThan(1);
    expect(severe).toBeLessThan(mild);
    expect(severe).toBeGreaterThanOrEqual(0.2);
  });
});

describe('t3Level', () => {
  it('rises with T4 at a fixed illness level', () => {
    expect(t3Level(12, 0, 0)).toBeGreaterThan(t3Level(6, 0, 0));
  });

  it('falls when illness suppresses conversion, even at a fixed T4', () => {
    expect(t3Level(8, 80, 0)).toBeLessThan(t3Level(8, 0, 0));
  });

  it('falls acutely from an illness bolus even before T4 itself has moved', () => {
    expect(t3Level(8, 0, 0.6)).toBeLessThan(t3Level(8, 0, 0));
  });
});

describe('t4LevelTarget', () => {
  it('rises with TSH', () => {
    expect(t4LevelTarget(0.8, 1, 0, 0)).toBeGreaterThan(t4LevelTarget(0.1, 1, 0, 0));
  });

  it('is low despite high TSH when thyroidGlandFunction is near 0 (primary hypothyroidism)', () => {
    expect(t4LevelTarget(1, 0.05, 0, 0)).toBeLessThan(t4LevelTarget(1, 1, 0, 0));
  });

  it('rises with autonomous thyroid stimulation even at TSH=0 (Graves\' / toxic nodule)', () => {
    expect(t4LevelTarget(0, 1, 60, 0)).toBeGreaterThan(t4LevelTarget(0, 1, 0, 0));
  });

  it('rises with exogenous levothyroxine', () => {
    expect(t4LevelTarget(0, 1, 0, 150)).toBeGreaterThan(t4LevelTarget(0, 1, 0, 0));
  });

  it('is clamped within [MIN, MAX]', () => {
    expect(t4LevelTarget(1, 1.5, 100, 300)).toBeLessThanOrEqual(30);
    expect(t4LevelTarget(0, 0, 0, 0)).toBeGreaterThanOrEqual(0.5);
  });
});
