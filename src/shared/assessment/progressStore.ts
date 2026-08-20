/** Per-question outcome history for one module. */
export interface ModuleSummary {
  attempted: number;
  correct: number;
  /** Most recent outcome per question id, for "you got this wrong last time" prompts. */
  lastOutcome: Record<string, boolean>;
}

/**
 * Storage seam for assessment progress.
 *
 * Everything the quiz needs goes through this interface so the localStorage implementation
 * can be swapped for a server-backed one without touching the quiz itself — the point being
 * to reach real learners, and real willingness-to-pay signal, before building a backend.
 */
export interface ProgressStore {
  record(moduleId: string, questionId: string, correct: boolean): void;
  summary(moduleId: string): ModuleSummary;
  reset(moduleId?: string): void;
}

const EMPTY: ModuleSummary = { attempted: 0, correct: 0, lastOutcome: {} };
const STORAGE_KEY = 'physiologyLab.progress.v1';

type Persisted = Record<string, ModuleSummary>;

function emptySummary(): ModuleSummary {
  return { attempted: 0, correct: 0, lastOutcome: {} };
}

function applyRecord(all: Persisted, moduleId: string, questionId: string, correct: boolean): Persisted {
  const current = all[moduleId] ?? emptySummary();
  return {
    ...all,
    [moduleId]: {
      attempted: current.attempted + 1,
      correct: current.correct + (correct ? 1 : 0),
      lastOutcome: { ...current.lastOutcome, [questionId]: correct },
    },
  };
}

/** In-memory store. Used by tests, and as the fallback when localStorage is unavailable
 * (private browsing, storage disabled) — progress is then simply not persisted, which is
 * a better outcome than the quiz throwing. */
export function createMemoryProgressStore(initial: Persisted = {}): ProgressStore {
  let all: Persisted = { ...initial };
  return {
    record(moduleId, questionId, correct) {
      all = applyRecord(all, moduleId, questionId, correct);
    },
    summary(moduleId) {
      return all[moduleId] ?? EMPTY;
    },
    reset(moduleId) {
      if (moduleId === undefined) all = {};
      else {
        const next = { ...all };
        delete next[moduleId];
        all = next;
      }
    },
  };
}

function readAll(): Persisted {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : {};
  } catch {
    // Corrupt or unreadable payload: start clean rather than trapping the learner in an
    // error they cannot clear from inside the app.
    return {};
  }
}

function writeAll(all: Persisted): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Quota exceeded or storage disabled — progress is lost, the quiz still works.
  }
}

export function createLocalStorageProgressStore(): ProgressStore {
  if (typeof window === 'undefined' || !window.localStorage) return createMemoryProgressStore();

  return {
    record(moduleId, questionId, correct) {
      writeAll(applyRecord(readAll(), moduleId, questionId, correct));
    },
    summary(moduleId) {
      return readAll()[moduleId] ?? EMPTY;
    },
    reset(moduleId) {
      if (moduleId === undefined) {
        writeAll({});
        return;
      }
      const all = readAll();
      delete all[moduleId];
      writeAll(all);
    },
  };
}
