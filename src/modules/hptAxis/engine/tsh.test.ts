import { describe, expect, it } from 'vitest';
import { tshLevelTarget } from './tsh';

describe('tshLevelTarget', () => {
  it('rises with TRH drive', () => {
    expect(tshLevelTarget(0.8, 8, 96, 1)).toBeGreaterThan(tshLevelTarget(0.1, 8, 96, 1));
  });

  it('is suppressed by rising T4/T3 (negative feedback)', () => {
    expect(tshLevelTarget(0.5, 15, 180, 1)).toBeLessThan(tshLevelTarget(0.5, 4, 48, 1));
  });

  it('is zero when pituitaryTshFunction is 0, regardless of TRH drive (secondary hypothyroidism)', () => {
    expect(tshLevelTarget(1, 2, 24, 0)).toBe(0);
  });

  it('scales with pituitaryTshFunction', () => {
    expect(tshLevelTarget(0.8, 8, 96, 0.5)).toBeLessThan(tshLevelTarget(0.8, 8, 96, 1));
  });
});
