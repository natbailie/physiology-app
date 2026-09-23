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
  /** The module's preset labels, or null when no preset bar is mounted. */
  scenarioLabels: Record<string, string> | null;
  /** True while the preset bar is locked. Consumers must not load a scenario. */
  scenariosLocked: boolean;
  applyScenario: (id: string) => void;
  /** Called by PresetBar on mount and whenever its labels or locked state change. */
  registerScenarios: (registration: ScenarioRegistration | null) => void;
  /**
   * The engine's `historyCapacity` — the number of points a chart is sized for. A `Sparkline` that
   * does not know it stretches whatever points it has across the whole frame, so a module opening
   * on a trace that is still filling draws a two-point line corner to corner and compresses it on
   * every tick. It is a shell-wide fact about the page, so it comes through here rather than being
   * threaded onto each of the ninety-odd charts by hand.
   */
  historyCapacity: number | null;
  /** Scrolls the lab region back under the sticky header. */
  revealLab: () => void;
  registerRevealLab: (reveal: () => void) => void;
}

const ModuleShellContext = createContext<ModuleShellValue>({
  moduleId: '',
  blinded: false,
  scenarioLabels: null,
  scenariosLocked: false,
  applyScenario: () => {},
  registerScenarios: () => {},
  historyCapacity: null,
  revealLab: () => {},
  registerRevealLab: () => {},
});

/**
 * Lets the two ends of a module page talk without threading props through all 45 of them.
 *
 * The diagram needs to know a question is open so it stops printing the answer, and the
 * explainer — which sits below everything — needs to load the scenario a paragraph is talking
 * about. Both are shell-wide facts about the page rather than anything a module should have to
 * pass down, which is what keeps this feature out of all 45 module pages.
 *
 * The handlers themselves live in refs and only the data a consumer RENDERS goes through state.
 * Storing a function in state would republish the context on every registration, re-running the
 * effect that registered it.
 */
export function ModuleShellProvider({
  blinded,
  moduleId = '',
  historyCapacity = null,
  children,
}: {
  blinded: boolean;
  /** Optional so the tests that mount this provider alone keep working; a module page always
   *  passes one. */
  moduleId?: string;
  /** Optional for the same reason. A chart with no capacity falls back to its own point count,
   *  which is what every chart did before this existed. */
  historyCapacity?: number | null;
  children: ReactNode;
}) {
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
      scenarioLabels,
      scenariosLocked,
      applyScenario,
      registerScenarios,
      historyCapacity,
      revealLab,
      registerRevealLab,
    }),
    [
      moduleId,
      blinded,
      scenarioLabels,
      scenariosLocked,
      applyScenario,
      registerScenarios,
      historyCapacity,
      revealLab,
      registerRevealLab,
    ],
  );
  return <ModuleShellContext.Provider value={value}>{children}</ModuleShellContext.Provider>;
}

export function useModuleShell(): ModuleShellValue {
  return useContext(ModuleShellContext);
}
