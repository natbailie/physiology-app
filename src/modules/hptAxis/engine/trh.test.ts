import { describe, expect, it } from 'vitest';
import { trhDriveTarget } from './trh';

describe('trhDriveTarget', () => {
  it('is suppressed by rising T4/T3 (negative feedback)', () => {
    expect(trhDriveTarget(15, 180)).toBeLessThan(trhDriveTarget(4, 48));
  });

  it('rises as T4/T3 fall below the feedback setpoint', () => {
    expect(trhDriveTarget(2, 24)).toBeGreaterThan(trhDriveTarget(8, 96));
  });

  it('is clamped to [0, 1]', () => {
    expect(trhDriveTarget(0.5, 6)).toBeLessThanOrEqual(1);
    expect(trhDriveTarget(30, 360)).toBeGreaterThanOrEqual(0);
  });
});
