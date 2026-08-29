import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Stable setter for one input key, shared by every module's slider rail.
 *
 * Each page declared this as a plain function in its body, which gave the control panel a new
 * `onChange` on every render — and since the engine tick re-renders the page ten to thirty times
 * a second, that made the panel impossible to memoise. A `useCallback` here lets `ControlPanel`
 * skip re-rendering its whole slider stack on every frame of the simulation.
 */
export function useInputSetter<TInputs>(
  setInputs: Dispatch<SetStateAction<TInputs>>,
): <K extends keyof TInputs>(key: K, value: TInputs[K]) => void {
  return useCallback(
    <K extends keyof TInputs>(key: K, value: TInputs[K]) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    [setInputs],
  );
}
