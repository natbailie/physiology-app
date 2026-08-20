import { describe, expect, it } from 'vitest';
import { createMemoryProgressStore } from './progressStore';

describe('progress store', () => {
  it('starts empty for an unknown module', () => {
    const store = createMemoryProgressStore();
    expect(store.summary('respiratory')).toEqual({ attempted: 0, correct: 0, lastOutcome: {} });
  });

  it('tallies attempts and correct answers separately', () => {
    const store = createMemoryProgressStore();
    store.record('respiratory', 'q1', true);
    store.record('respiratory', 'q2', false);
    store.record('respiratory', 'q3', true);

    const summary = store.summary('respiratory');
    expect(summary.attempted).toBe(3);
    expect(summary.correct).toBe(2);
  });

  it('keeps modules independent', () => {
    const store = createMemoryProgressStore();
    store.record('respiratory', 'q1', true);
    store.record('cardiorenal', 'q1', false);

    expect(store.summary('respiratory').correct).toBe(1);
    expect(store.summary('cardiorenal').correct).toBe(0);
  });

  it('remembers the LAST outcome per question, not the first', () => {
    const store = createMemoryProgressStore();
    store.record('respiratory', 'q1', false);
    store.record('respiratory', 'q1', true);

    // Both attempts count, but the standing verdict is the latest one — that is what a
    // "come back to this" prompt should key off.
    expect(store.summary('respiratory').attempted).toBe(2);
    expect(store.summary('respiratory').lastOutcome.q1).toBe(true);
  });

  it('resets one module without touching the others', () => {
    const store = createMemoryProgressStore();
    store.record('respiratory', 'q1', true);
    store.record('cardiorenal', 'q1', true);

    store.reset('respiratory');
    expect(store.summary('respiratory').attempted).toBe(0);
    expect(store.summary('cardiorenal').attempted).toBe(1);
  });

  it('resets everything when given no module', () => {
    const store = createMemoryProgressStore();
    store.record('respiratory', 'q1', true);
    store.record('cardiorenal', 'q1', true);

    store.reset();
    expect(store.summary('respiratory').attempted).toBe(0);
    expect(store.summary('cardiorenal').attempted).toBe(0);
  });
});
