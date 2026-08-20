import { describe, expect, it } from 'vitest';
import { pH } from './acidBase';

describe('pH (Henderson-Hasselbalch)', () => {
  it('matches the expected baseline value', () => {
    expect(pH(24, 40)).toBeCloseTo(7.4, 2);
  });

  it('falls as PaCO2 rises at fixed HCO3- (respiratory acidosis direction)', () => {
    expect(pH(24, 60)).toBeLessThan(pH(24, 40));
  });

  it('rises as PaCO2 falls at fixed HCO3- (respiratory alkalosis direction)', () => {
    expect(pH(24, 25)).toBeGreaterThan(pH(24, 40));
  });

  it('falls as HCO3- falls at fixed PaCO2 (metabolic acidosis direction)', () => {
    expect(pH(12, 40)).toBeLessThan(pH(24, 40));
  });

  it('rises as HCO3- rises at fixed PaCO2 (metabolic alkalosis direction)', () => {
    expect(pH(36, 40)).toBeGreaterThan(pH(24, 40));
  });
});
