import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface ScenarioPresetOptions<TInputs, TPresetName extends string> {
  setInputs: Dispatch<SetStateAction<TInputs>>;
  /** The module's calibrated baseline. Every preset is built from these, never from whatever
   * the sliders happen to be showing. */
  defaults: TInputs;
  presets: Record<TPresetName, Partial<TInputs>>;
  /** `useEngineLoop`'s reset: fresh state, settled against the inputs it is handed. */
  resetEngine: (inputsOverride?: TInputs) => void;
  /**
   * Extra simulated seconds for scenarios that are the same inputs LATER.
   *
   * Fetal circulation's "Transitioned" is "First breath" some hours on — the duct has closed and
   * pulmonary resistance has fallen — and nothing in the inputs distinguishes them, so the two
   * buttons produced the same picture. Where a scenario is defined by elapsed time rather than by
   * a setting, name its time here.
   */
  settleOverrides?: Partial<Record<TPresetName, number>>;
  /** `useEngineLoop`'s fastForward, required only when `settleOverrides` is given. */
  fastForward?: (seconds: number, inputsOverride?: TInputs) => void;
}

/**
 * What pressing a scenario button has to do.
 *
 * Every page used to inline `setInputs((prev) => ({ ...prev, ...PRESETS[name] }))`, which was
 * wrong twice over.
 *
 * It merged onto the CURRENT inputs, so partial presets stacked silently: pressing "Heart
 * failure" and then "High salt diet" left contractility at 0.35 and gave you a salt-loaded
 * failing heart labelled as a salt load. Building from `defaults` makes a preset mean one thing.
 *
 * And it changed only the inputs, leaving the engine to relax into the scenario in real time.
 * Cardiorenal's own engine test settles 3600 simulated seconds to demonstrate a high salt diet —
 * ten real minutes at 1x — so the scenario a learner was shown was a transient that never
 * arrived. Handing the new inputs to `resetEngine` lands on the settled scenario immediately,
 * which is also the state the verification harness checks.
 */
export function useScenarioPreset<TInputs, TPresetName extends string>({
  setInputs,
  defaults,
  presets,
  resetEngine,
  settleOverrides,
  fastForward,
}: ScenarioPresetOptions<TInputs, TPresetName>): (name: TPresetName) => void {
  return useCallback(
    (name: TPresetName) => {
      const next = { ...defaults, ...presets[name] };
      setInputs(next);
      // The override is required: `inputsRef` only syncs on the next commit, so without it the
      // engine settles four thousand seconds of the scenario being replaced.
      resetEngine(next);
      const extra = settleOverrides?.[name];
      if (extra && fastForward) fastForward(extra, next);
    },
    [setInputs, defaults, presets, resetEngine, settleOverrides, fastForward],
  );
}
