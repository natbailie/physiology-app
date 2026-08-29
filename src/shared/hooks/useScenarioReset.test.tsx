// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useEngineLoop, type EngineLoopConfig } from './useEngineLoop';
import { useScenarioReset } from './useScenarioReset';

// vitest runs with `globals: false`, so Testing Library's automatic cleanup is never
// registered; each hook would otherwise keep its rAF loop alive for the whole file.
afterEach(cleanup);

interface CounterState {
  elapsed: number;
}
interface CounterInputs {
  rate: number;
}
interface CounterDerived {
  doubled: number;
  /** Derived straight from the inputs, so a snapshot computed against stale inputs shows up. */
  rate: number;
}

const DEFAULT_INPUTS: CounterInputs = { rate: 1 };

const counterConfig: EngineLoopConfig<CounterState, CounterInputs, CounterDerived, number> = {
  createInitialState: () => ({ elapsed: 0 }),
  step: (state, inputs, dtSeconds) => {
    const next = { elapsed: state.elapsed + inputs.rate * dtSeconds };
    return { state: next, derived: { doubled: next.elapsed * 2, rate: inputs.rate } };
  },
  computeDerived: (state, inputs) => ({ doubled: state.elapsed * 2, rate: inputs.rate }),
  toHistoryPoint: (snapshot) => snapshot.state.elapsed,
  maxDtSeconds: 0.1,
  renderIntervalMs: 0,
  historyCapacity: 100,
  timeScale: 1,
};

/** A stand-in for a module page: shareable inputs, an engine loop, and the reset that
 * PresetBar's button is wired to. */
function setup() {
  return renderHook(() => {
    const [inputs, setInputs] = useState<CounterInputs>(DEFAULT_INPUTS);
    const loop = useEngineLoop(inputs, counterConfig);
    const resetScenario = useScenarioReset({
      setInputs,
      defaults: DEFAULT_INPUTS,
      resetEngine: loop.reset,
      baseline: loop.baseline,
      transport: loop.transport,
    });
    return { inputs, setInputs, ...loop, resetScenario };
  });
}

describe('useScenarioReset', () => {
  it('returns the inputs to the module baseline', () => {
    const { result } = setup();

    // What applying a preset does: the sliders move, and the engine derives from them.
    act(() => result.current.setInputs({ rate: 9 }));
    expect(result.current.inputs.rate).toBe(9);

    act(() => result.current.resetScenario());
    expect(result.current.inputs).toEqual(DEFAULT_INPUTS);
  });

  it('clears the engine state and history', () => {
    const { result } = setup();

    act(() => result.current.transport.pause());
    act(() => result.current.transport.stepOnce());
    expect(result.current.snapshot.state.elapsed).toBeGreaterThan(0);
    expect(result.current.history.length).toBeGreaterThan(0);

    act(() => result.current.resetScenario());
    expect(result.current.snapshot.state.elapsed).toBe(0);
    expect(result.current.history).toEqual([]);
  });

  it('clears the frozen baseline overlay', () => {
    const { result } = setup();

    act(() => result.current.transport.pause());
    act(() => result.current.transport.stepOnce());
    act(() => result.current.baseline.capture());
    expect(result.current.baseline.history).not.toBeNull();

    act(() => result.current.resetScenario());
    expect(result.current.baseline.history).toBeNull();
  });

  it('derives the fresh snapshot from the defaults, not the scenario being left', () => {
    // `inputsRef` inside useEngineLoop syncs via an effect, so the engine would otherwise
    // re-derive against the preset it has just been reset away from — and a module left paused
    // would keep showing that scenario's readouts.
    const { result } = setup();

    act(() => result.current.transport.pause());
    act(() => result.current.setInputs({ rate: 9 }));
    act(() => result.current.transport.stepOnce());
    expect(result.current.snapshot.derived.rate).toBe(9);

    act(() => result.current.resetScenario());
    expect(result.current.snapshot.derived.rate).toBe(DEFAULT_INPUTS.rate);
  });

  it('returns the transport to 1x and to playing', () => {
    const { result } = setup();

    act(() => result.current.transport.setSpeed(4));
    act(() => result.current.transport.pause());
    expect(result.current.transport.speed).toBe(4);
    expect(result.current.transport.playing).toBe(false);

    act(() => result.current.resetScenario());
    expect(result.current.transport.speed).toBe(1);
    expect(result.current.transport.playing).toBe(true);
  });
});
