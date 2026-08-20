import { describe, expect, it } from 'vitest';
import { tickAdrenalReserve } from './adrenalReserve';

describe('tickAdrenalReserve', () => {
  it('does not deplete when exogenous glucocorticoid is at or below the suppression threshold', () => {
    expect(tickAdrenalReserve(1, 0, 3600)).toBeCloseTo(1, 5);
    expect(tickAdrenalReserve(1, 50, 3600)).toBeCloseTo(1, 5);
  });

  it('depletes over sustained exposure above the suppression threshold', () => {
    const short = tickAdrenalReserve(1, 150, 3600);
    const long = tickAdrenalReserve(1, 150, 86400);
    expect(short).toBeLessThan(1);
    expect(long).toBeLessThan(short);
  });

  it('does not recover while still suppressed, even starting from a depleted state', () => {
    const reserve = tickAdrenalReserve(0.05, 150, 3600);
    expect(reserve).toBeLessThanOrEqual(0.05);
  });

  it('recovers once suppression is lifted', () => {
    expect(tickAdrenalReserve(0.05, 0, 3600)).toBeGreaterThan(0.05);
  });

  it('is clamped within [MIN, 1]', () => {
    expect(tickAdrenalReserve(1, 300, 1e9)).toBeGreaterThanOrEqual(0.05);
    expect(tickAdrenalReserve(0.05, 0, 1e9)).toBeLessThanOrEqual(1);
  });
});
