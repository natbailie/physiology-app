import { describe, expect, it } from 'vitest';
import { preloadFactor } from './starling';

describe('preloadFactor', () => {
  it('increases with blood volume up toward the optimal point', () => {
    const low = preloadFactor(50, 1);
    const mid = preloadFactor(100, 1);
    const high = preloadFactor(120, 1);
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
  });

  it('decompensates (falls) past the overload threshold when contractility is very low', () => {
    const atThreshold = preloadFactor(150, 0.2);
    const wellPastThreshold = preloadFactor(200, 0.2);
    expect(wellPastThreshold).toBeLessThan(atThreshold);
  });

  it('does not decompensate past the threshold when contractility is strong', () => {
    const atThreshold = preloadFactor(150, 1);
    const wellPastThreshold = preloadFactor(200, 1);
    expect(wellPastThreshold).toBeGreaterThanOrEqual(atThreshold - 1e-9);
  });
});
