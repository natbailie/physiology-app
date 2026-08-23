import type { SupabaseClient } from '@supabase/supabase-js';
import {
  applyRecord,
  emptySummary,
  type ModuleSummary,
  type Persisted,
  type ProgressStore,
} from './progressStore';

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
export function createSupabaseProgressStore(userId: string, client: SupabaseClient | null): SubscribableProgressStore {
  // Captured once so the closures below never re-test a mutable client for null.
  const db = client;
  let all: Persisted = {};
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
    all = applyRecord(all, row.module_id, row.question_id, row.is_correct);
  };

  // Seed from the server. Rows already applied locally (answered during the fetch) are
  // recognised by id and not double-counted.
  if (db) {
    void db
      .from(TABLE)
      .select('id, module_id, question_id, is_correct')
      .eq('user_id', userId)
      .order('created_at')
      .then(({ data }) => {
        if (disposed || !data) return;
        const seen = new Set<string>();
        let merged: Persisted = {};
        for (const row of data as AttemptRow[]) {
          seen.add(row.id);
          merged = applyRecord(merged, row.module_id, row.question_id, row.is_correct);
        }
        for (const row of pending) {
          if (!seen.has(row.id)) merged = applyRecord(merged, row.module_id, row.question_id, row.is_correct);
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
          const { error } = await db
            .from(TABLE)
            .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
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
      };
      pending.push(row);
      if (pending.length > MAX_PENDING) pending.shift();
      applyRow(row);
      touch();
      scheduleFlush();
    },

    summary(moduleId): ModuleSummary {
      return all[moduleId] ?? emptySummary();
    },

    reset(moduleId) {
      pending.length = 0;
      if (moduleId === undefined) {
        all = {};
      } else {
        const next: Persisted = {};
        for (const [key, value] of Object.entries(all)) {
          if (key !== moduleId) next[key] = value;
        }
        all = next;
      }
      touch();
      if (db) {
        let query = db.from(TABLE).delete().eq('user_id', userId);
        if (moduleId !== undefined) query = query.eq('module_id', moduleId);
        void query;
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
