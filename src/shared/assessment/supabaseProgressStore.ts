import type { SupabaseClient } from '@supabase/supabase-js';
import {
  applyRecord,
  emptyProgress,
  emptySummary,
  type ModuleSummary,
  type PersistedProgress,
  type ProgressStore,
} from './progressStore';
import { currentStreak, dueQuestions } from './scheduling';

/** A store whose data can arrive after first render — the hook subscribes to re-render on it. */
export interface SubscribableProgressStore extends ProgressStore {
  subscribe(listener: () => void): () => void;
  /** Monotonic change counter; the subscription snapshot for useSyncExternalStore. */
  readonly version: number;
}

interface AttemptRow {
  /** Client-generated, so retries are idempotent and a mid-flight fetch cannot double-count. */
  id: string;
  /** Sent explicitly and verified by the RLS policy — a row for someone else is rejected. */
  user_id: string;
  module_id: string;
  question_id: string;
  is_correct: boolean;
  /**
   * When the attempt happened, epoch ms.
   *
   * Carried because the review ladder is REPLAYED from these rows rather than stored: feeding
   * them through `applyRecord` in order rebuilds exactly the schedule the learner would have
   * had locally. Omitted on insert — the column defaults to now() server-side — and read back
   * on hydration.
   */
  at?: number;
}

/** What the server sends back. `created_at` is the authoritative time for a replay. */
interface StoredAttemptRow {
  id: string;
  module_id: string;
  question_id: string;
  is_correct: boolean;
  created_at: string;
}

const TABLE = 'question_attempts';
const MAX_PENDING = 500;

function newRowId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Server-backed store for signed-in learners.
 *
 * The ProgressStore interface is synchronous, so the pattern is: apply every record to an
 * in-memory mirror immediately (the tally the UI reads), then push rows to Supabase in the
 * background. Failed pushes are retried on the next record and dropped past MAX_PENDING —
 * progress is eventually-consistent, never blocking, and a dropped attempt costs less than
 * a quiz that breaks because the wifi hiccuped.
 */
export function createSupabaseProgressStore(
  userId: string,
  client: SupabaseClient | null,
  now: () => number = () => Date.now(),
): SubscribableProgressStore {
  // Captured once so the closures below never re-test a mutable client for null.
  const db = client;
  let all: PersistedProgress = emptyProgress();
  let version = 0;
  const pending: AttemptRow[] = [];
  const listeners = new Set<() => void>();
  let flushing = false;
  let disposed = false;

  const touch = () => {
    version += 1;
    for (const listener of listeners) listener();
  };

  const applyRow = (row: AttemptRow) => {
    all = applyRecord(all, row.module_id, row.question_id, row.is_correct, row.at ?? Date.now());
  };

  // Seed from the server. Rows already applied locally (answered during the fetch) are
  // recognised by id and not double-counted.
  if (db) {
    void db
      .from(TABLE)
      .select('id, module_id, question_id, is_correct, created_at')
      .eq('user_id', userId)
      .order('created_at')
      .then(({ data }) => {
        if (disposed || !data) return;
        const seen = new Set<string>();
        // Replayed in created_at order through the same fold the local store uses, so the
        // rebuilt ladder matches what the learner had before they signed in on this device.
        let merged = emptyProgress();
        for (const row of data as StoredAttemptRow[]) {
          seen.add(row.id);
          merged = applyRecord(merged, row.module_id, row.question_id, row.is_correct, Date.parse(row.created_at));
        }
        for (const row of pending) {
          if (!seen.has(row.id)) {
            merged = applyRecord(merged, row.module_id, row.question_id, row.is_correct, row.at ?? Date.now());
          }
        }
        all = merged;
        touch();
      });
  }

  function scheduleFlush() {
    if (flushing || !db || disposed || pending.length === 0) return;
    flushing = true;
    void (async () => {
      try {
        while (pending.length > 0) {
          // An upsert that ignores duplicates makes retries safe: a row which actually
          // landed is never inserted twice.
          const batch = [...pending];
          // `at` is client-side bookkeeping for the replay; the column is server-defaulted.
          const rows = batch.map(({ at: _at, ...row }) => row);
          const { error } = await db
            .from(TABLE)
            .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
          if (error) return; // retried when the next record arrives
          // Rows were already folded into the local tally at record() time — clearing them
          // from pending is all that is needed. Re-applying here would double-count.
          pending.splice(0, batch.length);
        }
      } finally {
        flushing = false;
      }
    })();
  }

  return {
    record(moduleId, questionId, correct) {
      const row: AttemptRow = {
        id: newRowId(),
        user_id: userId,
        module_id: moduleId,
        question_id: questionId,
        is_correct: correct,
        at: now(),
      };
      pending.push(row);
      if (pending.length > MAX_PENDING) pending.shift();
      applyRow(row);
      touch();
      scheduleFlush();
    },

    summary(moduleId): ModuleSummary {
      return all.modules[moduleId] ?? emptySummary();
    },

    allSummaries() {
      return all.modules;
    },

    due(moduleId, questionIds) {
      const summary = all.modules[moduleId];
      return summary ? dueQuestions(summary.schedule, questionIds, now()) : [];
    },

    streak() {
      return currentStreak(all.studyDays, now());
    },

    reset(moduleId) {
      pending.length = 0;
      if (moduleId === undefined) {
        all = emptyProgress();
      } else {
        const modules: Record<string, ModuleSummary> = {};
        for (const [key, value] of Object.entries(all.modules)) {
          if (key !== moduleId) modules[key] = value;
        }
        all = { ...all, modules };
      }
      touch();
      if (db) {
        let query = db.from(TABLE).delete().eq('user_id', userId);
        if (moduleId !== undefined) query = query.eq('module_id', moduleId);
        // A PostgREST builder is a lazy thenable: it does not issue the request until it is
        // awaited or `.then`-ed. Discarding it with a bare `void` sent nothing at all, so the
        // rows survived on the server and reappeared the next time the store rehydrated.
        void query.then(({ error }) => {
          if (error) console.warn('progress reset did not reach the server', error.message);
        });
      }
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    get version() {
      return version;
    },
  };
}
