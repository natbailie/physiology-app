import { describe, expect, it } from 'vitest';
import { todaysRound, type RoundBed } from './useRound';
import type { Acuity } from '@/shared/cases/acuity';

function bed(id: string, acuity: Acuity): RoundBed {
  return {
    id,
    moduleId: 'shockStates',
    name: id,
    age: 40,
    oneLiner: 'A presenting complaint.',
    questionIds: ['q'],
    acuity,
    dueCount: 0,
    moduleName: 'Shock States',
    unlocked: true,
  };
}

/** Noon UTC on a fixed day, so the daily draw is pinned. */
const NOON = Date.UTC(2026, 8, 14, 12);

describe('todaysRound', () => {
  it('always shows crash and due beds, even past board size', () => {
    const beds = [
      ...Array.from({ length: 8 }, (_, i) => bed(`crash-${i}`, 'crash')),
      ...Array.from({ length: 8 }, (_, i) => bed(`due-${i}`, 'due')),
      ...Array.from({ length: 8 }, (_, i) => bed(`new-${i}`, 'newAdmission')),
    ];
    const { today, rest } = todaysRound(beds, NOON, 10);
    // The guarantee wins over the bound: nothing needing review is hidden.
    expect(today.filter((b) => b.acuity === 'crash')).toHaveLength(8);
    expect(today.filter((b) => b.acuity === 'due')).toHaveLength(8);
    expect(today.length + rest.length).toBe(beds.length);
  });

  it('bounds a healthy ward to board size with the rest behind the expander', () => {
    const beds = Array.from({ length: 26 }, (_, i) => bed(`new-${i}`, 'newAdmission'));
    const { today, rest } = todaysRound(beds, NOON, 10);
    expect(today).toHaveLength(10);
    expect(rest).toHaveLength(16);
    // Partition, no overlap, rest in rank order.
    expect(new Set([...today, ...rest].map((b) => b.id)).size).toBe(26);
    expect(rest.map((b) => b.id)).toEqual(beds.filter((b) => !today.some((t) => t.id === b.id)).map((b) => b.id));
  });

  it('deals the same ward all day and a new one tomorrow', () => {
    const beds = Array.from({ length: 26 }, (_, i) => bed(`new-${i}`, 'newAdmission'));
    const morning = todaysRound(beds, NOON, 10).today.map((b) => b.id);
    const evening = todaysRound(beds, NOON + 6 * 3_600_000, 10).today.map((b) => b.id);
    expect(evening).toEqual(morning);
    const orders = new Set(
      Array.from({ length: 31 }, (_, d) => todaysRound(beds, NOON + d * 86_400_000, 10).today.map((b) => b.id).join(',')),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it('shows everything when the ward fits', () => {
    const beds = [bed('a', 'due'), bed('b', 'newAdmission')];
    const { today, rest } = todaysRound(beds, NOON, 10);
    expect(today.map((b) => b.id)).toEqual(['a', 'b']);
    expect(rest).toEqual([]);
  });
});
