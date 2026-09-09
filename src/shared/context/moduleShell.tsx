import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

/** What PresetBar publishes so the rest of the shell can load a scenario. */
export interface ScenarioRegistration {
  labels: Record<string, string>;
  apply: (id: string) => void;
  /** Mirrors PresetBar's own `disabled`: true while a pattern question locks the bar. */
  disabled: boolean;
}

interface ModuleShellValue {
  /** Which module the page is showing, so a readout label can be looked up against the module
   * that owns it — seventeen of them print a tile called `State` and mean something different
   * by it. Empty outside a module page, where the shared table alone answers. */
  moduleId: string;
  /** True while a pattern-discrimination question hides the inputs. Consumed by the diagram so
   * it can withhold the classification it would otherwise print in the corner. */
  blinded: boolean;
  /** Whether practice is idle and can be started from the header. */
  canStartPractice: boolean;
  startPractice: () => void;
  /** Called by QuizPanel: the handler while a session can be started, null while one is running. */
  registerStartPractice: (start: (() => void) | null) => void;
  /** The module's preset labels, or null when no preset bar is mounted. */
  scenarioLabels: Record<string, string> | null;
  /** True while the preset bar is locked. Consumers must not load a scenario. */
  scenariosLocked: boolean;
  applyScenario: (id: string) => void;
  /** Called by PresetBar on mount and whenever its labels or locked state change. */
  registerScenarios: (registration: ScenarioRegistration | null) => void;
  /** Scrolls the lab region back under the sticky header. */
  revealLab: () => void;
  registerRevealLab: (reveal: () => void) => void;
}

const ModuleShellContext = createContext<ModuleShellValue>({
  moduleId: '',
  blinded: false,
  canStartPractice: false,
  startPractice: () => {},
  registerStartPractice: () => {},
  scenarioLabels: null,
  scenariosLocked: false,
  applyScenario: () => {},
  registerScenarios: () => {},
  revealLab: () => {},
  registerRevealLab: () => {},
});

/**
 * Lets the two ends of a module page talk without threading props through all 45 of them.
 *
 * The header needs a practice button that only QuizPanel knows how to trigger, the diagram
 * needs to know a question is open so it stops printing the answer, and the explainer — which
 * sits below everything — needs to load the scenario a paragraph is talking about. All three
 * are shell-wide facts about the page rather than anything a module should have to pass down,
 * which is what keeps this feature out of all 45 module pages.
 *
 * The handlers themselves live in refs and only the data a consumer RENDERS goes through state.
 * Storing a function in state would republish the context on every registration, re-running the
 * effect that registered it.
 */
export function ModuleShellProvider({
  blinded,
  moduleId = '',
  children,
}: {
  blinded: boolean;
  /** Optional so the tests that mount this provider alone keep working; a module page always
   *  passes one. */
  moduleId?: string;
  children: ReactNode;
}) {
  const starter = useRef<(() => void) | null>(null);
  const [canStartPractice, setCanStartPractice] = useState(false);

  const registerStartPractice = useCallback((start: (() => void) | null) => {
    starter.current = start;
    setCanStartPractice(start != null);
  }, []);

  const startPractice = useCallback(() => starter.current?.(), []);

  // The apply function stays in a ref; only the labels and the lock — the two things a
  // consumer needs in order to render — go through state.
  const applier = useRef<((id: string) => void) | null>(null);
  const [scenarioLabels, setScenarioLabels] = useState<Record<string, string> | null>(null);
  const [scenariosLocked, setScenariosLocked] = useState(false);

  const registerScenarios = useCallback((registration: ScenarioRegistration | null) => {
    applier.current = registration?.apply ?? null;
    setScenarioLabels(registration?.labels ?? null);
    setScenariosLocked(registration?.disabled ?? false);
  }, []);

  /**
   * Refuses while the bar is locked. This is the same protection PresetBar's `disabled` gives:
   * loading a different scenario mid-question silently replaces the one being asked about.
   * The lock is read from a ref rather than the state closure so a stale render cannot let a
   * click through.
   */
  const lockedRef = useRef(false);
  lockedRef.current = scenariosLocked;
  const applyScenario = useCallback((id: string) => {
    if (lockedRef.current) return;
    applier.current?.(id);
  }, []);

  const revealer = useRef<(() => void) | null>(null);
  const registerRevealLab = useCallback((reveal: () => void) => {
    revealer.current = reveal;
  }, []);
  const revealLab = useCallback(() => revealer.current?.(), []);

  const value = useMemo(
    () => ({
      moduleId,
      blinded,
      canStartPractice,
      startPractice,
      registerStartPractice,
      scenarioLabels,
      scenariosLocked,
      applyScenario,
      registerScenarios,
      revealLab,
      registerRevealLab,
    }),
    [
      moduleId,
      blinded,
      canStartPractice,
      startPractice,
      registerStartPractice,
      scenarioLabels,
      scenariosLocked,
      applyScenario,
      registerScenarios,
      revealLab,
      registerRevealLab,
    ],
  );
  return <ModuleShellContext.Provider value={value}>{children}</ModuleShellContext.Provider>;
}

export function useModuleShell(): ModuleShellValue {
  return useContext(ModuleShellContext);
}
