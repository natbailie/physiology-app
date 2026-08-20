// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useEngineLoop, type EngineLoopConfig } from './useEngineLoop';

// vitest runs with `globals: false`, so Testing Library's automatic cleanup is never
// registered; each hook would otherwise keep its rAF loop alive for the whole file.
afterEach(cleanup);

/** A trivial engine whose state is just integrated time, so an advance of `dt` is
 * expected to land exactly on `dt`. Keeps these tests about the transport, not physics. */
interface CounterState {
  elapsed: number;
}
interface CounterInputs {
  rate: number;
}
interface CounterDerived {
  doubled: number;
}

const counterConfig: EngineLoopConfig<CounterState, CounterInputs, CounterDerived, number> = {
  createInitialState: () => ({ elapsed: 0 }),
  step: (state, inputs, dtSeconds) => {
    const next = { elapsed: state.elapsed + inputs.rate * dtSeconds };
    return { state: next, derived: { doubled: next.elapsed * 2 } };
  },
  computeDerived: (state) => ({ doubled: state.elapsed * 2 }),
  toHistoryPoint: (snapshot) => snapshot.state.elapsed,
  maxDtSeconds: 0.1,
  renderIntervalMs: 0,
  historyCapacity: 100,
  timeScale: 1,
};

function setup() {
  return renderHook(() => useEngineLoop({ rate: 1 }, counterConfig));
}

describe('useEngineLoop transport', () => {
  it('starts playing when the user has expressed no motion preference', () => {
    const { result } = setup();
    expect(result.current.transport.playing).toBe(true);
  });

  it('pause and play flip the transport state', () => {
    const { result } = setup();

    act(() => result.current.transport.pause());
    expect(result.current.transport.playing).toBe(false);

    act(() => result.current.transport.play());
    expect(result.current.transport.playing).toBe(true);

    act(() => result.current.transport.toggle());
    expect(result.current.transport.playing).toBe(false);
  });

  it('steps a fixed, repeatable slice of time while paused', () => {
    const { result } = setup();
    act(() => result.current.transport.pause());

    act(() => result.current.transport.stepOnce());
    const afterOne = result.current.snapshot.state.elapsed;
    expect(afterOne).toBeCloseTo(0.25, 6);

    // The point of a step control is that two presses go exactly twice as far.
    act(() => result.current.transport.stepOnce());
    expect(result.current.snapshot.state.elapsed).toBeCloseTo(afterOne * 2, 6);
  });

  it('sub-steps so no single engine call exceeds maxDtSeconds', () => {
    const seen: number[] = [];
    const spyConfig: EngineLoopConfig<CounterState, CounterInputs, CounterDerived, number> = {
      ...counterConfig,
      step: (state, inputs, dtSeconds) => {
        seen.push(dtSeconds);
        return counterConfig.step(state, inputs, dtSeconds);
      },
    };
    const { result } = renderHook(() => useEngineLoop({ rate: 1 }, spyConfig));

    act(() => result.current.transport.pause());
    seen.length = 0;
    act(() => result.current.transport.stepOnce());

    expect(seen.length).toBeGreaterThan(1);
    for (const dt of seen) {
      expect(dt).toBeLessThanOrEqual(counterConfig.maxDtSeconds + 1e-9);
    }
  });

  it('honours a pause issued in the same tick as the step that follows it', () => {
    const { result } = setup();

    // A user can pause and immediately press Step. If the paused flag only reached the
    // loop via an effect, this step would be swallowed.
    act(() => {
      result.current.transport.pause();
      result.current.transport.stepOnce();
    });

    expect(result.current.snapshot.state.elapsed).toBeCloseTo(0.25, 6);
  });

  it('applies a speed change to a step issued in the same tick', () => {
    const { result } = setup();

    act(() => {
      result.current.transport.pause();
      result.current.transport.setSpeed(4);
      result.current.transport.stepOnce();
    });

    expect(result.current.snapshot.state.elapsed).toBeCloseTo(1, 6);
  });

  it('ignores a step request while playing, so the button cannot double-advance time', () => {
    const { result } = setup();
    expect(result.current.transport.playing).toBe(true);

    const before = result.current.snapshot.state.elapsed;
    act(() => result.current.transport.stepOnce());
    expect(result.current.snapshot.state.elapsed).toBe(before);
  });

  it('scales the step by the selected speed', () => {
    const { result } = setup();
    act(() => result.current.transport.pause());
    act(() => result.current.transport.setSpeed(2));

    act(() => result.current.transport.stepOnce());
    expect(result.current.snapshot.state.elapsed).toBeCloseTo(0.5, 6);
  });
});

describe('useEngineLoop baseline', () => {
  it('captures nothing until asked', () => {
    const { result } = setup();
    expect(result.current.baseline.history).toBeNull();
  });

  it('freezes the trace at capture time and does not move with the live run', () => {
    const { result } = setup();
    act(() => result.current.transport.pause());
    act(() => result.current.transport.stepOnce());

    act(() => result.current.baseline.capture());
    const frozen = result.current.baseline.history;
    expect(frozen).not.toBeNull();
    const frozenLength = frozen!.length;

    act(() => result.current.transport.stepOnce());
    expect(result.current.baseline.history).toHaveLength(frozenLength);
    expect(result.current.history.length).toBeGreaterThan(frozenLength);
  });

  it('clears back to nothing', () => {
    const { result } = setup();
    act(() => result.current.baseline.capture());
    act(() => result.current.baseline.clear());
    expect(result.current.baseline.history).toBeNull();
  });

  it('survives a reset, so a frozen run can be compared against a fresh one', () => {
    const { result } = setup();
    act(() => result.current.transport.pause());
    act(() => result.current.transport.stepOnce());
    act(() => result.current.baseline.capture());

    act(() => result.current.reset());

    expect(result.current.history).toHaveLength(0);
    expect(result.current.baseline.history).not.toBeNull();
    expect(result.current.snapshot.state.elapsed).toBe(0);
  });
});
