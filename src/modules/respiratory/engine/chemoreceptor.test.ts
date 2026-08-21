import { describe, expect, it } from 'vitest';
import { centralDriveTarget, chemoreceptorDriveTarget, hypoxicDriveTarget } from './chemoreceptor';
import { CHEMORECEPTOR } from './constants';

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

  it('caps the central component below the top of the range, leaving headroom for hypoxia', () => {
    // A severe retainer: CO2 and pH both saturate the central component on their own.
    const saturatedCentral = centralDriveTarget(90, 7.1);
    expect(saturatedCentral).toBeCloseTo(CHEMORECEPTOR.CENTRAL_MAX_DRIVE, 5);
    expect(saturatedCentral).toBeLessThan(1);
  });

  it('still gains drive from hypoxia when the central component is already saturated', () => {
    // The regression this guards: with the two components summed and clamped together,
    // both of these pinned at 1 and supplemental O2 became a consequence-free intervention.
    const hypoxaemic = chemoreceptorDriveTarget(90, 45, 7.1);
    const oxygenated = chemoreceptorDriveTarget(90, 250, 7.1);
    expect(hypoxaemic).toBeGreaterThan(oxygenated);
    expect(oxygenated).toBeCloseTo(CHEMORECEPTOR.CENTRAL_MAX_DRIVE, 5);
  });

  it('never lets hyperoxia push drive below the central set point', () => {
    expect(hypoxicDriveTarget(650)).toBe(0);
    expect(hypoxicDriveTarget(CHEMORECEPTOR.HYPOXIC_THRESHOLD_MMHG)).toBe(0);
    expect(hypoxicDriveTarget(30)).toBeGreaterThan(0);
  });
});
