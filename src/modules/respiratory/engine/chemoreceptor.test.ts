import { describe, expect, it } from 'vitest';
import { chemoreceptorDriveTarget } from './chemoreceptor';

describe('chemoreceptorDriveTarget', () => {
  it('is ~0 at baseline PaCO2/PaO2/pH', () => {
    expect(chemoreceptorDriveTarget(40, 95, 7.4)).toBeCloseTo(0, 5);
  });

  it('rises as PaCO2 rises above baseline', () => {
    expect(chemoreceptorDriveTarget(55, 95, 7.4)).toBeGreaterThan(chemoreceptorDriveTarget(40, 95, 7.4));
  });

  it('rises as pH falls', () => {
    expect(chemoreceptorDriveTarget(40, 95, 7.2)).toBeGreaterThan(chemoreceptorDriveTarget(40, 95, 7.4));
  });

  it('has negligible hypoxic contribution above PaO2 60, but rises sharply below it', () => {
    const aboveThreshold = chemoreceptorDriveTarget(40, 90, 7.4);
    const belowThreshold = chemoreceptorDriveTarget(40, 40, 7.4);
    expect(aboveThreshold).toBeCloseTo(0, 1);
    expect(belowThreshold).toBeGreaterThan(aboveThreshold);
  });

  it('is clamped to [-1, 1]', () => {
    expect(chemoreceptorDriveTarget(150, 20, 6.8)).toBeLessThanOrEqual(1);
    expect(chemoreceptorDriveTarget(10, 650, 7.9)).toBeGreaterThanOrEqual(-1);
  });
});
