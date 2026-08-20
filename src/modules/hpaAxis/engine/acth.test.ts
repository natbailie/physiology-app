import { describe, expect, it } from 'vitest';
import { acthLevelTarget } from './acth';

describe('acthLevelTarget', () => {
  it('rises with CRH drive', () => {
    expect(acthLevelTarget(0.8, 8, 1)).toBeGreaterThan(acthLevelTarget(0.1, 8, 1));
  });

  it('is suppressed by rising cortisol (negative feedback)', () => {
    expect(acthLevelTarget(0.5, 30, 1)).toBeLessThan(acthLevelTarget(0.5, 5, 1));
  });

  it('is zero when pituitaryFunction is 0, regardless of CRH drive (secondary insufficiency)', () => {
    expect(acthLevelTarget(1, 2, 0)).toBe(0);
  });

  it('scales with pituitaryFunction', () => {
    expect(acthLevelTarget(0.8, 8, 0.5)).toBeLessThan(acthLevelTarget(0.8, 8, 1));
  });
});
