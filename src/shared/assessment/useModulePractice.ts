import { useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { createLocalStorageProgressStore, type ModuleSummary, type ProgressStore } from './progressStore';
import type { ModuleQuestion } from './types';
import { useQuizSession, type QuizSession } from './useQuizSession';

interface ModulePracticeOptions<TInputs, TPreset extends string, TSnapshot> {
  moduleId: string;
  questions: readonly ModuleQuestion<TInputs, TPreset, TSnapshot>[];
  presets: Record<TPreset, Partial<TInputs>>;
  setInputs: Dispatch<SetStateAction<TInputs>>;
  captureBaseline: () => void;
  clearBaseline: () => void;
  resetEngine: () => void;
  /** Injectable for tests; defaults to the localStorage-backed store. */
  store?: ProgressStore;
}

let defaultStore: ProgressStore | null = null;
function sharedStore(): ProgressStore {
  defaultStore ??= createLocalStorageProgressStore();
  return defaultStore;
}

/**
 * Everything a module page needs to offer practice, so wiring a new module is three lines
 * rather than a re-implementation of the session plumbing.
 */
export function useModulePractice<TInputs, TPreset extends string, TSnapshot>({
  moduleId,
  questions,
  presets,
  setInputs,
  captureBaseline,
  clearBaseline,
  resetEngine,
  store,
}: ModulePracticeOptions<TInputs, TPreset, TSnapshot>): {
  session: QuizSession<TInputs, TPreset, TSnapshot>;
  summary: ModuleSummary;
} {
  const activeStore = useMemo(() => store ?? sharedStore(), [store]);

  const applyInputs = useCallback(
    (patch: Partial<TInputs>, preset?: TPreset) => {
      setInputs((prev) => ({ ...prev, ...(preset ? presets[preset] : {}), ...patch }));
    },
    [setInputs, presets],
  );

  const session = useQuizSession({
    moduleId,
    questions,
    applyInputs,
    captureBaseline,
    clearBaseline,
    resetEngine,
    store: activeStore,
  });

  // Read during render so the tally reflects the answer just recorded — the session state
  // change is what re-renders us.
  const summary = activeStore.summary(moduleId);

  return { session, summary };
}
