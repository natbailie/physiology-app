import { currentStreak, dueQuestions, reviewAfter, studyDayOf, type ReviewState } from './scheduling';

/** Per-question outcome history for one module. */
export interface ModuleSummary {
  attempted: number;
  correct: number;
  /** Most recent outcome per question id, for "you got this wrong last time" prompts. */
  lastOutcome: Record<string, boolean>;
  /** Where each question sits on the spaced-repetition ladder. */
  schedule: Record<string, ReviewState>;
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
  /** Every module's summary at once — what the home screen needs to show where to go next. */
  allSummaries(): Record<string, ModuleSummary>;
  /** Question ids in `questionIds` that are due for review now, most overdue first. */
  due(moduleId: string, questionIds: readonly string[]): string[];
  /** Consecutive days studied, counting back from today. */
  streak(): number;
  reset(moduleId?: string): void;
}

const EMPTY: ModuleSummary = { attempted: 0, correct: 0, lastOutcome: {}, schedule: {} };
const STORAGE_KEY = 'physiologyLab.progress.v2';
const LEGACY_STORAGE_KEY = 'physiologyLab.progress.v1';

/**
 * Everything one learner has done.
 *
 * `studyDays` sits beside the modules rather than inside them because a streak is a property of
 * the learner, not of any one topic — studying respiratory on Monday and cardiology on Tuesday
 * is a two-day streak.
 */
export interface PersistedProgress {
  modules: Record<string, ModuleSummary>;
  /** Local calendar dates on which at least one question was answered. */
  studyDays: string[];
}

/** Retained for the server store, which keys its in-memory mirror the same way. */
export type Persisted = Record<string, ModuleSummary>;

export function emptySummary(): ModuleSummary {
  return { attempted: 0, correct: 0, lastOutcome: {}, schedule: {} };
}

export function emptyProgress(): PersistedProgress {
  return { modules: {}, studyDays: [] };
}

/** A year and a bit of streak history is plenty, and bounds what we ask localStorage to hold. */
const MAX_STUDY_DAYS = 400;

/**
 * The one definition of what recording an attempt does — both stores must agree with it.
 *
 * It takes the timestamp rather than reading a clock, which is what makes the two stores
 * consistent by construction. The localStorage store folds attempts forward as they happen; the
 * server store replays its rows through this same function in `created_at` order when it
 * hydrates. Same function, same order, same result — so a learner's review queue is identical
 * whether it was built live or rebuilt from the server.
 */
export function applyRecord(
  all: PersistedProgress,
  moduleId: string,
  questionId: string,
  correct: boolean,
  at: number,
): PersistedProgress {
  const current = all.modules[moduleId] ?? emptySummary();
  const day = studyDayOf(at);
  const studyDays = all.studyDays.includes(day)
    ? all.studyDays
    : [...all.studyDays, day].slice(-MAX_STUDY_DAYS);

  return {
    modules: {
      ...all.modules,
      [moduleId]: {
        attempted: current.attempted + 1,
        correct: current.correct + (correct ? 1 : 0),
        lastOutcome: { ...current.lastOutcome, [questionId]: correct },
        schedule: {
          ...current.schedule,
          [questionId]: reviewAfter(current.schedule[questionId], correct, at),
        },
      },
    },
    studyDays,
  };
}

/**
 * Reads a v1 payload — a bare `Record<moduleId, summary>` with no schedule and no study days.
 *
 * A learner part-way through must not lose their record because the shape changed, so the
 * tallies carry over verbatim and the ladder is seeded from `lastOutcome`: anything they last
 * got right starts one box up, anything they missed starts due. Study days cannot be recovered
 * (v1 stored no timestamps), so the streak restarts — the one thing genuinely lost, and the
 * cheapest of the three to lose.
 */
export function migrateV1(legacy: Record<string, ModuleSummary>, at: number): PersistedProgress {
  const modules: Record<string, ModuleSummary> = {};
  for (const [moduleId, summary] of Object.entries(legacy)) {
    const schedule: Record<string, ReviewState> = {};
    for (const [questionId, wasCorrect] of Object.entries(summary.lastOutcome ?? {})) {
      schedule[questionId] = reviewAfter(undefined, wasCorrect, at);
    }
    modules[moduleId] = {
      attempted: summary.attempted ?? 0,
      correct: summary.correct ?? 0,
      lastOutcome: summary.lastOutcome ?? {},
      schedule,
    };
  }
  return { modules, studyDays: [] };
}

function makeStore(
  read: () => PersistedProgress,
  write: (all: PersistedProgress) => void,
  now: () => number,
): ProgressStore {
  return {
    record(moduleId, questionId, correct) {
      write(applyRecord(read(), moduleId, questionId, correct, now()));
    },
    summary(moduleId) {
      return read().modules[moduleId] ?? EMPTY;
    },
    allSummaries() {
      return read().modules;
    },
    due(moduleId, questionIds) {
      const summary = read().modules[moduleId];
      return summary ? dueQuestions(summary.schedule, questionIds, now()) : [];
    },
    streak() {
      return currentStreak(read().studyDays, now());
    },
    reset(moduleId) {
      const all = read();
      if (moduleId === undefined) {
        write(emptyProgress());
        return;
      }
      const modules = { ...all.modules };
      delete modules[moduleId];
      write({ ...all, modules });
    },
  };
}

/** In-memory store. Used by tests, and as the fallback when localStorage is unavailable
 * (private browsing, storage disabled) — progress is then simply not persisted, which is
 * a better outcome than the quiz throwing. */
export function createMemoryProgressStore(
  initial: PersistedProgress = emptyProgress(),
  now: () => number = () => Date.now(),
): ProgressStore {
  let all: PersistedProgress = { modules: { ...initial.modules }, studyDays: [...initial.studyDays] };
  return makeStore(
    () => all,
    (next) => {
      all = next;
    },
    now,
  );
}

export function createLocalStorageProgressStore(now: () => number = () => Date.now()): ProgressStore {
  // globalThis, not window: the React Native app is what makes this file shareable byte-for-byte,
  // and there `expo-sqlite/localStorage/install` puts localStorage on globalThis. Identifying the
  // storage by a held reference rather than by name means the same guarded fallback to the
  // memory store covers an absent web localStorage and an RN build that never installed the shim.
  const storage =
    typeof globalThis.localStorage === 'object' && globalThis.localStorage !== null
      ? globalThis.localStorage
      : null;
  if (!storage) return createMemoryProgressStore(emptyProgress(), now);

  const read = (): PersistedProgress => {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedProgress;
        // Tolerate a partially-written payload rather than trapping the learner.
        return { modules: parsed.modules ?? {}, studyDays: parsed.studyDays ?? [] };
      }
      const legacy = storage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) return migrateV1(JSON.parse(legacy) as Record<string, ModuleSummary>, now());
      return emptyProgress();
    } catch {
      // Corrupt or unreadable payload: start clean rather than trapping the learner in an
      // error they cannot clear from inside the app.
      return emptyProgress();
    }
  };

  const write = (all: PersistedProgress): void => {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // Quota exceeded or storage disabled — progress is lost, the quiz still works.
    }
  };

  return makeStore(read, write, now);
}
