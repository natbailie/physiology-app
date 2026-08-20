import { describe, expect, it } from 'vitest';
import { renalCompensationDriveTarget } from './renalCompensation';

describe('renalCompensationDriveTarget', () => {
  it('is ~0 at baseline pH', () => {
    expect(renalCompensationDriveTarget(7.4, 1)).toBeCloseTo(0, 5);
  });

  it('rises (positive) as pH falls, at full capacity', () => {
    expect(renalCompensationDriveTarget(7.2, 1)).toBeGreaterThan(0);
  });

  it('falls (negative) as pH rises, at full capacity', () => {
    expect(renalCompensationDriveTarget(7.6, 1)).toBeLessThan(0);
  });

  it('scales with capacity', () => {
    expect(renalCompensationDriveTarget(7.2, 0.5)).toBeLessThan(renalCompensationDriveTarget(7.2, 1));
  });

  it('is always 0 when capacity is 0, regardless of pH derangement (e.g. dialysis-dependent CKD)', () => {
    expect(renalCompensationDriveTarget(6.9, 0)).toBeCloseTo(0, 10);
    expect(renalCompensationDriveTarget(7.9, 0)).toBeCloseTo(0, 10);
  });
});
