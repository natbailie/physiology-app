import { describe, expect, it } from 'vitest';
import {
  createMemoryProgressStore,
  emptyProgress,
  migrateV1,
  type ModuleSummary,
} from './progressStore';

describe('progress store', () => {
  it('starts empty for an unknown module', () => {
    const store = createMemoryProgressStore();
    expect(store.summary('respiratory')).toEqual({ attempted: 0, correct: 0, lastOutcome: {}, schedule: {} });
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

describe('scheduling rides on the same fold as the tally', () => {
  const AT = new Date(2026, 7, 17, 12).getTime();
  const DAY = 86_400_000;

  it('schedules a missed question for immediate review and a correct one for later', () => {
    const store = createMemoryProgressStore(emptyProgress(), () => AT);
    store.record('respiratory', 'missed', false);
    store.record('respiratory', 'known', true);

    expect(store.due('respiratory', ['missed', 'known'])).toEqual(['missed']);
  });

  it('reports nothing due for a module never opened', () => {
    const store = createMemoryProgressStore(emptyProgress(), () => AT);
    expect(store.due('respiratory', ['q1'])).toEqual([]);
  });

  it('lets a question fall due again once its interval has passed', () => {
    let now = AT;
    const store = createMemoryProgressStore(emptyProgress(), () => now);
    store.record('respiratory', 'q1', true);
    expect(store.due('respiratory', ['q1'])).toEqual([]);

    now = AT + 2 * DAY;
    expect(store.due('respiratory', ['q1'])).toEqual(['q1']);
  });

  it('counts a streak across modules, because a streak belongs to the learner', () => {
    let now = AT;
    const store = createMemoryProgressStore(emptyProgress(), () => now);
    store.record('respiratory', 'q1', true);
    now = AT + DAY;
    store.record('cardiorenal', 'q1', true);

    expect(store.streak()).toBe(2);
  });

  it('exposes every module at once, for the home screen', () => {
    const store = createMemoryProgressStore(emptyProgress(), () => AT);
    store.record('respiratory', 'q1', true);
    store.record('cardiorenal', 'q1', false);

    expect(Object.keys(store.allSummaries()).sort()).toEqual(['cardiorenal', 'respiratory']);
  });
});

describe('migrating a v1 record', () => {
  const AT = new Date(2026, 7, 17, 12).getTime();

  const legacy = {
    respiratory: { attempted: 5, correct: 3, lastOutcome: { q1: true, q2: false } },
  } as unknown as Record<string, ModuleSummary>;

  it('carries the tally over verbatim, so nobody loses their record to a shape change', () => {
    const migrated = migrateV1(legacy, AT);
    expect(migrated.modules.respiratory?.attempted).toBe(5);
    expect(migrated.modules.respiratory?.correct).toBe(3);
    expect(migrated.modules.respiratory?.lastOutcome).toEqual({ q1: true, q2: false });
  });

  it('seeds the ladder from what they last got right, so old misses come back first', () => {
    const migrated = migrateV1(legacy, AT);
    const schedule = migrated.modules.respiratory!.schedule;
    expect(schedule.q2!.dueAt).toBeLessThanOrEqual(AT);
    expect(schedule.q1!.dueAt).toBeGreaterThan(AT);
  });

  it('survives a payload missing the fields it expects', () => {
    const partial = { respiratory: {} } as unknown as Record<string, ModuleSummary>;
    expect(() => migrateV1(partial, AT)).not.toThrow();
    expect(migrateV1(partial, AT).modules.respiratory?.attempted).toBe(0);
  });
});
