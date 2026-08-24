import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseProgressStore } from './supabaseProgressStore';

interface FakeRow {
  id: string;
  module_id: string;
  question_id: string;
  is_correct: boolean;
}

/**
 * A stand-in for the Supabase client that records what the store asked it to do. Only the
 * three operations the store uses are modelled: select (hydration), insert (flush), delete.
 */
function fakeClient() {
  const inserted: FakeRow[] = [];
  const deleteFilters: [string, string | undefined][] = [];
  let deletesIssued = 0;
  let insertsFail = false;
  let resolveFetch: ((rows: FakeRow[]) => void) | null = null;

  const client = {
    from(table: string) {
      if (table !== 'question_attempts') throw new Error(`unexpected table: ${table}`);
      return {
        select() {
          return {
            eq() {
              return {
                order() {
                  return new Promise<{ data: FakeRow[] }>((resolve) => {
                    resolveFetch = (rows) => resolve({ data: rows });
                  });
                },
              };
            },
          };
        },
        insert(batch: FakeRow[]) {
          return Promise.resolve().then(() => {
            if (insertsFail) return { error: { message: 'network unreachable' } };
            inserted.push(...batch);
            return { error: null };
          });
        },
        // The store upserts with ignoreDuplicates so retries are idempotent; for the fake
        // the behaviour that matters is identical to insert.
        upsert(batch: FakeRow[]) {
          return this.insert(batch);
        },
        delete() {
          const chain = {
            eq(column: string, value?: string) {
              deleteFilters.push([column, value]);
              return chain;
            },
            /**
             * A PostgREST builder is a lazy thenable — it only issues the request when it is
             * awaited. Modelling that is the whole point of this fake: the store used to build
             * the delete and drop it with a bare `void`, so the filters below were recorded and
             * the request was never sent. Counting `then` is what tells the two apart.
             */
            then<T>(onFulfilled: (value: { error: null }) => T): Promise<T> {
              deletesIssued += 1;
              return Promise.resolve({ error: null }).then(onFulfilled);
            },
          };
          return chain;
        },
      };
    },
    __setInsertsFail(fail: boolean) {
      insertsFail = fail;
    },
    __releaseFetch(rows: FakeRow[]) {
      if (!resolveFetch) throw new Error('no hydration fetch in flight');
      resolveFetch(rows);
    },
  };

  const moduleFilters = () => deleteFilters.filter(([col]) => col === 'module_id').map(([, v]) => v);

  return { client: client as unknown as SupabaseClient, inserted, moduleFilters, deletesIssued: () => deletesIssued, __setInsertsFail: client.__setInsertsFail, __releaseFetch: client.__releaseFetch };
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('supabase-backed progress store', () => {
  it('tallies locally the moment an answer is recorded, before any network round-trip', async () => {
    const { client } = fakeClient();
    const store = createSupabaseProgressStore('user-1', client);

    store.record('respiratory', 'q1', true);
    expect(store.summary('respiratory')).toMatchObject({ attempted: 1, correct: 1 });

    await settle();
    expect(store.summary('respiratory').attempted).toBe(1);
  });

  it('keeps the ProgressStore contract: both attempts count and the last verdict stands', async () => {
    const { client } = fakeClient();
    const store = createSupabaseProgressStore('user-1', client);

    store.record('respiratory', 'q1', false);
    store.record('respiratory', 'q1', true);

    const summary = store.summary('respiratory');
    expect(summary.attempted).toBe(2);
    expect(summary.correct).toBe(1);
    expect(summary.lastOutcome.q1).toBe(true);

    await settle();
  });

  it('pushes recorded answers to the server', async () => {
    const { client, inserted } = fakeClient();
    const store = createSupabaseProgressStore('user-1', client);

    store.record('cardiorenal', 'q1', true);
    store.record('respiratory', 'q2', false);

    await settle();
    expect(inserted).toHaveLength(2);
    expect(inserted.map((r) => r.module_id)).toEqual(['cardiorenal', 'respiratory']);
  });

  it('a failed push does not disturb the learner, and is retried on the next answer', async () => {
    const { client, inserted, __setInsertsFail } = fakeClient();
    const store = createSupabaseProgressStore('user-1', client);

    __setInsertsFail(true);
    store.record('respiratory', 'q1', true);
    await settle();

    // The tally survives; only the sync failed.
    expect(store.summary('respiratory').attempted).toBe(1);
    expect(inserted).toHaveLength(0);

    __setInsertsFail(false);
    store.record('respiratory', 'q2', false);
    await settle();

    // Both rows land once the network returns.
    expect(inserted).toHaveLength(2);
    expect(store.summary('respiratory').attempted).toBe(2);
  });

  it('hydration from another device cannot double-count answers given during the fetch', async () => {
    const { client, inserted, __releaseFetch } = fakeClient();
    const store = createSupabaseProgressStore('user-1', client);

    // Answered while the fetch is still in flight; its insert lands first.
    store.record('respiratory', 'q1', true);
    await settle();
    expect(inserted).toHaveLength(1);

    // The server snapshot includes that very row plus one from a previous device.
    __releaseFetch([...inserted, { id: 'old-row', module_id: 'cardiorenal', question_id: 'q9', is_correct: false }]);
    await settle();

    expect(store.summary('respiratory').attempted).toBe(1);
    expect(store.summary('cardiorenal').attempted).toBe(1);
    expect(store.summary('cardiorenal').lastOutcome.q9).toBe(false);
  });

  it('shows history from other devices after hydration', async () => {
    const { client, __releaseFetch } = fakeClient();
    const store = createSupabaseProgressStore('user-1', client);

    __releaseFetch([
      { id: 'a', module_id: 'shockStates', question_id: 'q1', is_correct: true },
      { id: 'b', module_id: 'shockStates', question_id: 'q2', is_correct: false },
    ]);
    await settle();

    const summary = store.summary('shockStates');
    expect(summary.attempted).toBe(2);
    expect(summary.correct).toBe(1);
    expect(summary.lastOutcome.q2).toBe(false);
  });

  it('resetting one module clears it locally without touching others, and scopes the server delete', async () => {
    const { client, moduleFilters, deletesIssued } = fakeClient();
    const store = createSupabaseProgressStore('user-1', client);

    store.record('respiratory', 'q1', true);
    store.record('cardiorenal', 'q1', true);
    await settle();

    store.reset('respiratory');
    expect(store.summary('respiratory').attempted).toBe(0);
    expect(store.summary('cardiorenal').attempted).toBe(1);
    expect(moduleFilters()).toEqual(['respiratory']);
    expect(deletesIssued(), 'the delete was built but never sent').toBe(1);

    await settle();
  });

  it('resetting everything discards every module locally and sends no module filter', async () => {
    const { client, moduleFilters, deletesIssued } = fakeClient();
    const store = createSupabaseProgressStore('user-1', client);

    store.record('respiratory', 'q1', true);
    store.record('cardiorenal', 'q1', true);

    store.reset();
    expect(store.summary('respiratory').attempted).toBe(0);
    expect(store.summary('cardiorenal').attempted).toBe(0);
    expect(moduleFilters()).toEqual([]);
    expect(deletesIssued(), 'the delete was built but never sent').toBe(1);

    await settle();
  });

  it('notifies subscribers whenever its tallies change', async () => {
    const { client } = fakeClient();
    const store = createSupabaseProgressStore('user-1', client);

    let notifications = 0;
    const unsubscribe = store.subscribe(() => {
      notifications += 1;
    });

    store.record('respiratory', 'q1', true);
    expect(notifications).toBeGreaterThanOrEqual(1);

    unsubscribe();
    store.record('respiratory', 'q2', false);
    expect(notifications).toBe(1);

    await settle();
  });
});
