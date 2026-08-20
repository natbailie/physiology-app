import { describe, expect, it } from 'vitest';
import { crhDriveTarget } from './crh';

describe('crhDriveTarget', () => {
  it('rises with acute stress', () => {
    const low = crhDriveTarget(0, 0, 8, 0);
    const high = crhDriveTarget(80, 0, 8, 0);
    expect(high).toBeGreaterThan(low);
  });

  it('rises with an acute stress bolus', () => {
    expect(crhDriveTarget(0, 0.5, 8, 0)).toBeGreaterThan(crhDriveTarget(0, 0, 8, 0));
  });

  it('is suppressed by rising cortisol (negative feedback)', () => {
    expect(crhDriveTarget(0, 0, 30, 0)).toBeLessThan(crhDriveTarget(0, 0, 5, 0));
  });

  it('is clamped to [0, 1]', () => {
    expect(crhDriveTarget(100, 1, 0.5, 0)).toBeLessThanOrEqual(1);
    expect(crhDriveTarget(0, 0, 60, 0)).toBeGreaterThanOrEqual(0);
  });
});
