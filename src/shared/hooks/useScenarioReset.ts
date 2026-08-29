import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { SimBaseline, SimTransport } from './useEngineLoop';

interface ScenarioResetOptions<TInputs, THistoryPoint> {
  setInputs: Dispatch<SetStateAction<TInputs>>;
  /** The module's calibrated baseline — normal physiology, and what the engine tests assert. */
  defaults: TInputs;
  /** `useEngineLoop`'s own reset: engine state and history. */
  resetEngine: (inputsOverride?: TInputs) => void;
  baseline: SimBaseline<THistoryPoint>;
  transport: SimTransport;
}

/**
 * Everything the Reset button has to undo.
 *
 * It used to be wired straight to `useEngineLoop`'s `reset`, which rebuilds engine STATE and
 * history and nothing else. The inputs live in `useShareableInputs`, so the sliders kept whatever
 * preset was last applied and the engine simply re-derived it: pressing Reset on complete heart
 * block restarted the simulation and produced complete heart block again. The frozen baseline
 * overlay and the playback speed survived too.
 *
 * The defaults are handed to `resetEngine` as well as to `setInputs`, because the engine reads
 * its inputs from a ref that only syncs on the next commit — without the override the fresh state
 * is derived against the scenario being reset away from.
 */
export function useScenarioReset<TInputs, THistoryPoint>({
  setInputs,
  defaults,
  resetEngine,
  baseline,
  transport,
}: ScenarioResetOptions<TInputs, THistoryPoint>): () => void {
  // Destructured so the returned callback depends on the stable member functions rather than on
  // the transport/baseline objects, which are rebuilt on every render.
  const clearBaseline = baseline.clear;
  const resetTransport = transport.reset;

  return useCallback(() => {
    setInputs(defaults);
    resetEngine(defaults);
    clearBaseline();
    resetTransport();
  }, [setInputs, defaults, resetEngine, clearBaseline, resetTransport]);
}
