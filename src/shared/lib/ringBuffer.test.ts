import { describe, expect, it } from 'vitest';
import { RingBuffer } from './ringBuffer';

describe('RingBuffer', () => {
  it('returns items in chronological order before wrapping', () => {
    const buf = new RingBuffer<number>(5);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.toArray()).toEqual([1, 2, 3]);
    expect(buf.length).toBe(3);
  });

  it('wraps and keeps only the most recent `capacity` items in order', () => {
    const buf = new RingBuffer<number>(3);
    for (let i = 1; i <= 5; i++) buf.push(i);
    expect(buf.toArray()).toEqual([3, 4, 5]);
    expect(buf.length).toBe(3);
  });

  it('throws for non-positive capacity', () => {
    expect(() => new RingBuffer<number>(0)).toThrow();
  });
});
