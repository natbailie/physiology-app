import { describe, expect, it } from 'vitest';
import { summarise, validateReview } from './reviews';

describe('review summary', () => {
  it('computes the average from the rows, including the low ones', () => {
    const s = summarise([{ rating: 5 }, { rating: 5 }, { rating: 1 }]);
    expect(s.count).toBe(3);
    expect(s.average).toBe(3.7);
    expect(s.distribution).toEqual([1, 0, 0, 0, 2]);
  });

  it('claims no average when there is nothing to average', () => {
    expect(summarise([]).average).toBeNull();
  });
});

describe('review validation', () => {
  it('accepts a real review', () => {
    expect(validateReview({ rating: 4, body: 'Helped me understand Starling forces.', displayName: '' })).toBeNull();
  });

  it('requires a rating between one and five', () => {
    expect(validateReview({ rating: 0, body: 'Long enough body here', displayName: '' })).toMatch(/rating/);
    expect(validateReview({ rating: 6, body: 'Long enough body here', displayName: '' })).toMatch(/rating/);
  });

  it('rejects a body too short to be a review', () => {
    expect(validateReview({ rating: 3, body: 'ok', displayName: '' })).toMatch(/at least/);
  });
});
