import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ModuleSummary, ProgressStore } from './progressStore';
import type { ModuleQuestion, StateOf } from './types';
import { useQuizSession, type QuizSession } from './useQuizSession';
import { useProgressStore } from './useProgressStore';

interface ModulePracticeOptions<TInputs, TPreset extends string, TSnapshot> {
  moduleId: string;
  questions: readonly ModuleQuestion<TInputs, TPreset, TSnapshot>[];
  presets: Record<TPreset, Partial<TInputs>>;
  /** The page's live inputs. Needed as well as the setter so a preset applied for a pattern
   * question can be settled in the same tick, before React has committed the state change. */
  inputs: TInputs;
  /**
   * The module's baseline inputs.
   *
   * A question's SETUP is rebuilt from these rather than merged onto whatever is on screen,
   * because that is what the verification harness does — it settles
   * `{ ...defaultInputs, ...preset, ...setup.inputs }`. Presets are PARTIAL, so merging one onto
   * the previous question's leftovers silently carries them forward: a levothyroxine question
   * followed by a thyroid panel question showed a T4 raised by the drug from two questions ago,
   * and the panel a learner read was not the panel whose fairness had been checked.
   */
  defaultInputs: TInputs;
  setInputs: Dispatch<SetStateAction<TInputs>>;
  captureBaseline: () => void;
  clearBaseline: () => void;
  resetEngine: () => void;
  perturbEngine: (fn: (state: StateOf<TSnapshot>) => StateOf<TSnapshot>) => void;
  /** Integrates simulated time immediately, so a pattern scenario is shown already settled. */
  fastForwardEngine: (seconds: number, inputsOverride?: TInputs) => void;
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
  inputs,
  defaultInputs,
  setInputs,
  captureBaseline,
  clearBaseline,
  resetEngine,
  perturbEngine,
  fastForwardEngine,
  store,
}: ModulePracticeOptions<TInputs, TPreset, TSnapshot>): {
  session: QuizSession<TInputs, TPreset, TSnapshot>;
  summary: ModuleSummary;
} {
  const learnerStore = useProgressStore();
  const activeStore = store ?? learnerStore;

  /**
   * The array the session reads, held stable while one is running.
   *
   * Bedded pages derive their array from the tab, so a glance at the lab mid-question would
   * otherwise rebuild the list under a live session: the queue holds ids, the cursor would point
   * at one the new array cannot resolve, and worse, `blinded` would lapse — re-enabling the
   * preset bar and the controls mid-pattern-question, so the scenario being asked about could be
   * silently replaced. Holding the array keeps the question resolving and the shell blinded
   * until the session ends, at which point the current tab's set is adopted. Pages whose array
   * never changes identity cannot tell the difference.
   */
  const stableQuestions = useRef(questions);
  const sessionLive = useRef(false);
  if (!sessionLive.current) {
    stableQuestions.current = questions;
  }

  // The inputs a question has just asked for, available synchronously. React has not committed
  // `setInputs` by the time the session wants to settle the engine against them.
  const pendingInputs = useRef(inputs);
  pendingInputs.current = inputs;

  const applyInputs = useCallback(
    (patch: Partial<TInputs>, preset?: TPreset, fromDefaults = false) => {
      const base = fromDefaults ? defaultInputs : pendingInputs.current;
      const next = { ...base, ...(preset ? presets[preset] : {}), ...patch };
      pendingInputs.current = next;
      setInputs(next);
    },
    [setInputs, presets, defaultInputs],
  );

  const settleEngine = useCallback(
    (seconds: number) => fastForwardEngine(seconds, pendingInputs.current),
    [fastForwardEngine],
  );

  const session = useQuizSession({
    moduleId,
    questions: stableQuestions.current,
    applyInputs,
    captureBaseline,
    clearBaseline,
    resetEngine,
    perturbEngine,
    fastForwardEngine: settleEngine,
    store: activeStore,
  });

  // Committed after render, so the adoption check above reads the liveness of the last committed
  // phase rather than this tick's — a phase change and a tab switch in the same tick still hold.
  useEffect(() => {
    sessionLive.current = session.phase === 'predicting' || session.phase === 'revealed';
  }, [session.phase]);

  // Read during render so the tally reflects the answer just recorded — the session state
  // change is what re-renders us.
  const summary = activeStore.summary(moduleId);

  return { session, summary };
}
