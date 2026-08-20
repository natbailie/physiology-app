import { useEffect, useRef, useState } from 'react';
import { RingBuffer } from '@/shared/lib/ringBuffer';

export interface EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint> {
  createInitialState: () => TState;
  step: (state: TState, inputs: TInputs, dtSeconds: number) => { state: TState; derived: TDerived };
  computeDerived: (state: TState, inputs: TInputs) => TDerived;
  toHistoryPoint: (snapshot: { state: TState; derived: TDerived }) => THistoryPoint;
  maxDtSeconds: number;
  renderIntervalMs: number;
  historyCapacity: number;
  timeScale: number;
}

export interface UseEngineLoopResult<TState, TDerived, THistoryPoint> {
  snapshot: { state: TState; derived: TDerived };
  history: THistoryPoint[];
  reset: () => void;
  /** Applies an arbitrary state transform (e.g. an acute perturbation) and re-renders
   * immediately. Each module defines its own named wrapper around this, e.g.
   * `triggerHemorrhage` or `triggerBronchospasm`. */
  perturb: (fn: (state: TState) => TState) => void;
}

/**
 * Drives a module's simulation with requestAnimationFrame. Physics state lives in refs
 * and advances every frame (scaled by `timeScale` so multi-minute hormone/reflex
 * responses are watchable in real time); React state is only updated at a throttled
 * rate (`renderIntervalMs`) since numeric readouts/charts don't need 60Hz. `inputs` is
 * read from a ref kept fresh by a separate effect, so the loop effect itself never
 * tears down and restarts while the user is dragging a slider.
 */
export function useEngineLoop<TState, TInputs, TDerived, THistoryPoint>(
  inputs: TInputs,
  config: EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
): UseEngineLoopResult<TState, TDerived, THistoryPoint> {
  const inputsRef = useRef(inputs);
  const stateRef = useRef(config.createInitialState());
  const historyRef = useRef(new RingBuffer<THistoryPoint>(config.historyCapacity));

  const [snapshot, setSnapshot] = useState<{ state: TState; derived: TDerived }>(() => ({
    state: stateRef.current,
    derived: config.computeDerived(stateRef.current, inputs),
  }));
  const [history, setHistory] = useState<THistoryPoint[]>([]);

  useEffect(() => {
    inputsRef.current = inputs;
  }, [inputs]);

  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    let lastRenderTime = 0;

    function frame(now: number) {
      const realDtSeconds = Math.min((now - lastTime) / 1000, config.maxDtSeconds);
      lastTime = now;
      const simDtSeconds = realDtSeconds * config.timeScale;

      const result = config.step(stateRef.current, inputsRef.current, simDtSeconds);
      stateRef.current = result.state;
      historyRef.current.push(config.toHistoryPoint(result));

      if (now - lastRenderTime >= config.renderIntervalMs) {
        lastRenderTime = now;
        setSnapshot(result);
        setHistory(historyRef.current.toArray());
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally empty: config/inputs are read via refs so the loop never restarts
  }, []);

  function perturb(fn: (state: TState) => TState) {
    stateRef.current = fn(stateRef.current);
    setSnapshot({ state: stateRef.current, derived: config.computeDerived(stateRef.current, inputsRef.current) });
  }

  function reset() {
    stateRef.current = config.createInitialState();
    historyRef.current = new RingBuffer<THistoryPoint>(config.historyCapacity);
    const initial = { state: stateRef.current, derived: config.computeDerived(stateRef.current, inputsRef.current) };
    setSnapshot(initial);
    setHistory([]);
  }

  return { snapshot, history, reset, perturb };
}
