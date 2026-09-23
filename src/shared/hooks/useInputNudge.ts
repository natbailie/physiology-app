import { useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { clamp } from '@/shared/lib/math';
import type { ControlSpec } from '@/shared/presentation/types';

/**
 * A standing change to the patient in front of you, applied to the INPUTS.
 *
 * The distinction from `useScenarioPreset` is the whole of this file. A preset is a DIFFERENT
 * PATIENT, so it rebuilds the inputs from the module defaults and resets the engine — the scenario
 * arrives settled. A nudge is something that happens TO the patient already on screen, so it leaves
 * the engine state alone and lets the transient play out: a litre off the blood volume should show
 * the filling pressure fall and the reflex answer it, not cut to the settled result.
 *
 * What it does not do is write engine STATE, which is what `perturb` does and what left every one
 * of these buttons invisible on the control rail. `venousReturn`'s haemorrhage decremented a
 * `volumeOffsetMl` that `computeDerived` added to the slider value, so the model really did lose a
 * litre while the blood-volume slider went on reading 5000 — the page told a learner two different
 * things about one patient. Press it three times now and the slider walks down and stops at its own
 * minimum, which is the truth about the model.
 *
 * Ranges come from the module's own `ControlSpec`s and are never restated here — the same rule
 * `controls.test.tsx` follows when it reads slider ranges off the rendered panel. Clamping to them
 * matters for more than tidiness: an unclamped nudge can drive an input past the range the module
 * was calibrated over and out the far side of its own reference bands.
 */
export function useInputNudge<TInputs>(
  setInputs: Dispatch<SetStateAction<TInputs>>,
  controls: ReadonlyArray<ControlSpec<TInputs>>,
): (deltas: Partial<Record<string & keyof TInputs, number>>) => void {
  const ranges = useMemo(() => {
    const byKey = new Map<string, { min: number; max: number; step: number }>();
    for (const control of controls) {
      if (control.kind === 'slider') {
        byKey.set(control.key, { min: control.min, max: control.max, step: control.step });
      }
    }
    return byKey;
  }, [controls]);

  return useCallback(
    (deltas: Partial<Record<string & keyof TInputs, number>>) => {
      setInputs((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(deltas)) {
          const delta = value as number | undefined;
          if (delta === undefined) continue;
          const range = ranges.get(key);
          if (!range) {
            // A nudge with no slider behind it cannot be shown, cannot be clamped, and is the exact
            // bug this hook exists to stop — so it fails loudly here rather than quietly writing an
            // uncalibrated input. Reach for `perturb` if the change genuinely has no rail entry.
            throw new Error(`useInputNudge: "${key}" is not a slider on this module`);
          }
          const raw = clamp((prev as Record<string, number>)[key]! + delta, range.min, range.max);
          // Snapped to the slider's own step, so the value a nudge lands on is one the learner could
          // have dialled in by hand — a rail showing 4950 beside a thumb that can only stop at 4900
          // or 5000 is a third version of the same disagreement.
          const snapped = range.min + Math.round((raw - range.min) / range.step) * range.step;
          (next as Record<string, unknown>)[key] = clamp(snapped, range.min, range.max);
        }
        return next;
      });
    },
    [setInputs, ranges],
  );
}
