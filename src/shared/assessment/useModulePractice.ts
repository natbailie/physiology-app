import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ModuleSummary, ProgressStore } from './progressStore';
import type { ModuleQuestion, StateOf } from './types';
import { useQuizSession, type QuizSession } from './useQuizSession';
import { useProgressStore } from './useProgressStore';

interface ModulePracticeOptions<TInputs, TPreset extends string, TSnapshot> {
  moduleId: string;
  questions: readonly ModuleQuestion<TInputs, TPreset, TSnapshot>[];
  presets: Record<TPreset, Partial<TInputs>>;
  setInputs: Dispatch<SetStateAction<TInputs>>;
  captureBaseline: () => void;
  clearBaseline: () => void;
  resetEngine: () => void;
  perturbEngine: (fn: (state: StateOf<TSnapshot>) => StateOf<TSnapshot>) => void;
  /** Injectable for tests; overrides the learner's default (server or localStorage) store. */
  store?: ProgressStore;
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
  perturbEngine,
  store,
}: ModulePracticeOptions<TInputs, TPreset, TSnapshot>): {
  session: QuizSession<TInputs, TPreset, TSnapshot>;
  summary: ModuleSummary;
} {
  const learnerStore = useProgressStore();
  const activeStore = store ?? learnerStore;

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
    perturbEngine,
    store: activeStore,
  });

  // Read during render so the tally reflects the answer just recorded — the session state
  // change is what re-renders us.
  const summary = activeStore.summary(moduleId);

  return { session, summary };
}
