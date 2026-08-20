import { describe, expect, it } from 'vitest';
import { cortisolLevelTarget } from './cortisol';

describe('cortisolLevelTarget', () => {
  it('rises with ACTH', () => {
    expect(cortisolLevelTarget(0.8, 1, 1, 0, 0)).toBeGreaterThan(cortisolLevelTarget(0.1, 1, 1, 0, 0));
  });

  it('is low despite high ACTH when adrenalCortexFunction is near 0 (primary insufficiency)', () => {
    expect(cortisolLevelTarget(1, 0.05, 1, 0, 0)).toBeLessThan(cortisolLevelTarget(1, 1, 1, 0, 0));
  });

  it('is low despite full adrenal function when adrenalReserve is depleted (steroid-induced atrophy)', () => {
    expect(cortisolLevelTarget(1, 1, 0.05, 0, 0)).toBeLessThan(cortisolLevelTarget(1, 1, 1, 0, 0));
  });

  it('rises with autonomous adrenal secretion even at ACTH=0 (adenoma)', () => {
    expect(cortisolLevelTarget(0, 1, 1, 60, 0)).toBeGreaterThan(cortisolLevelTarget(0, 1, 1, 0, 0));
  });

  it('rises with exogenous glucocorticoid', () => {
    expect(cortisolLevelTarget(0, 1, 1, 0, 150)).toBeGreaterThan(cortisolLevelTarget(0, 1, 1, 0, 0));
  });

  it('is clamped within [MIN, MAX]', () => {
    expect(cortisolLevelTarget(1, 1.5, 1, 100, 300)).toBeLessThanOrEqual(60);
    expect(cortisolLevelTarget(0, 0, 0.05, 0, 0)).toBeGreaterThanOrEqual(0.5);
  });
});
