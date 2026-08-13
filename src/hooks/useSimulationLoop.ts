import { useEffect, useRef, useState } from 'react';
import { computeDerived, createInitialState, perturbBloodVolume, step } from '@/simulation/engine';
import { RingBuffer } from '@/simulation/ringBuffer';
import { SIMULATION } from '@/simulation/constants';
import type { SimInputs, SimSnapshot } from '@/simulation/types';

export interface HistoryPoint {
  t: number;
  map: number;
  gfr: number;
  bloodVolume: number;
}

export interface UseSimulationLoopResult {
  snapshot: SimSnapshot;
  history: HistoryPoint[];
  triggerHemorrhage: () => void;
  reset: () => void;
}

function toHistoryPoint(snapshot: SimSnapshot): HistoryPoint {
  return {
    t: snapshot.state.simTimeSeconds,
    map: snapshot.derived.meanArterialPressure,
    gfr: snapshot.derived.gfr,
    bloodVolume: snapshot.state.bloodVolume,
  };
}

/**
 * Drives the simulation with requestAnimationFrame. Physics state lives in refs and
 * advances every frame (scaled by SIMULATION.TIME_SCALE so multi-minute hormone
 * responses are watchable in real time); React state is only updated at a throttled
 * rate (SIMULATION.RENDER_INTERVAL_MS) since numeric readouts/charts don't need 60Hz.
 * `inputs` is read from a ref kept fresh by a separate effect, so the loop effect
 * itself never tears down and restarts while the user is dragging a slider.
 */
export function useSimulationLoop(inputs: SimInputs): UseSimulationLoopResult {
  const inputsRef = useRef(inputs);
  const stateRef = useRef(createInitialState());
  const historyRef = useRef(new RingBuffer<HistoryPoint>(SIMULATION.HISTORY_CAPACITY));

  const [snapshot, setSnapshot] = useState<SimSnapshot>(() => ({
    state: stateRef.current,
    derived: computeDerived(stateRef.current, inputs),
  }));
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    inputsRef.current = inputs;
  }, [inputs]);

  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    let lastRenderTime = 0;

    function frame(now: number) {
      const realDtSeconds = Math.min((now - lastTime) / 1000, SIMULATION.MAX_DT_SECONDS);
      lastTime = now;
      const simDtSeconds = realDtSeconds * SIMULATION.TIME_SCALE;

      const result = step(stateRef.current, inputsRef.current, simDtSeconds);
      stateRef.current = result.state;
      historyRef.current.push(toHistoryPoint(result));

      if (now - lastRenderTime >= SIMULATION.RENDER_INTERVAL_MS) {
        lastRenderTime = now;
        setSnapshot(result);
        setHistory(historyRef.current.toArray());
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  function triggerHemorrhage() {
    stateRef.current = perturbBloodVolume(stateRef.current, SIMULATION.HEMORRHAGE_BV_MULTIPLIER);
    setSnapshot({ state: stateRef.current, derived: computeDerived(stateRef.current, inputsRef.current) });
  }

  function reset() {
    stateRef.current = createInitialState();
    historyRef.current = new RingBuffer<HistoryPoint>(SIMULATION.HISTORY_CAPACITY);
    const initial = { state: stateRef.current, derived: computeDerived(stateRef.current, inputsRef.current) };
    setSnapshot(initial);
    setHistory([]);
  }

  return { snapshot, history, triggerHemorrhage, reset };
}
