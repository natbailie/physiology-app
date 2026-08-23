import { useCallback, useEffect, useRef, useState } from 'react';
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

/** Speed multipliers applied on top of each module's own `timeScale`. 1 is the
 * module's calibrated pace; the slow settings exist so fast events (an action
 * potential, a QRS) can be watched rather than inferred. */
export const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4] as const;

/** One press of "Step" advances this much REAL time (then scaled by timeScale and
 * speed). Chosen to be a visible nudge rather than a single imperceptible frame. */
const STEP_REAL_SECONDS = 0.25;

export interface SimTransport {
  playing: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Advance a fixed slice of time while paused. No-op while playing. */
  stepOnce: () => void;
  setSpeed: (multiplier: number) => void;
}

export interface SimBaseline<THistoryPoint> {
  /** Frozen copy of history at capture time, or null when nothing is captured. */
  history: THistoryPoint[] | null;
  capture: () => void;
  clear: () => void;
}

export interface UseEngineLoopResult<TState, TInputs, TDerived, THistoryPoint> {
  snapshot: { state: TState; derived: TDerived };
  history: THistoryPoint[];
  reset: () => void;
  /** Applies an arbitrary state transform (e.g. an acute perturbation) and re-renders
   * immediately. Each module defines its own named wrapper around this, e.g.
   * `triggerHemorrhage` or `triggerBronchospasm`. */
  perturb: (fn: (state: TState) => TState) => void;
  /** Integrates simulated time immediately, so a scenario can be shown already settled.
   * Pass `inputsOverride` when the inputs were changed in the same tick. */
  fastForward: (seconds: number, inputsOverride?: TInputs) => void;
  /** Play/pause/step/speed over simulated time. */
  transport: SimTransport;
  /** Freeze the current trace so a changed scenario can be compared against it. */
  baseline: SimBaseline<THistoryPoint>;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Drives a module's simulation with requestAnimationFrame. Physics state lives in refs
 * and advances every frame (scaled by `timeScale` so multi-minute hormone/reflex
 * responses are watchable in real time); React state is only updated at a throttled
 * rate (`renderIntervalMs`) since numeric readouts/charts don't need 60Hz. `inputs` and
 * `config` are read from refs kept fresh by a separate effect, so the loop effect itself
 * never tears down and restarts while the user is dragging a slider.
 *
 * The loop keeps running while paused (it simply stops integrating), so resuming is
 * instant and the elapsed wall-clock time is discarded rather than applied as one large
 * catch-up step.
 */
export function useEngineLoop<TState, TInputs, TDerived, THistoryPoint>(
  inputs: TInputs,
  config: EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
): UseEngineLoopResult<TState, TInputs, TDerived, THistoryPoint> {
  const inputsRef = useRef(inputs);
  const configRef = useRef(config);
  const stateRef = useRef(config.createInitialState());
  const historyRef = useRef(new RingBuffer<THistoryPoint>(config.historyCapacity));

  const [snapshot, setSnapshot] = useState<{ state: TState; derived: TDerived }>(() => ({
    state: stateRef.current,
    derived: config.computeDerived(stateRef.current, inputs),
  }));
  const [history, setHistory] = useState<THistoryPoint[]>([]);

  // Someone who has asked the OS for reduced motion should not be handed a
  // continuously animating diagram unprompted; they start paused and opt in.
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [speed, setSpeedState] = useState(1);
  const [baselineHistory, setBaselineHistory] = useState<THistoryPoint[] | null>(null);

  const playingRef = useRef(playing);
  const speedRef = useRef(speed);

  useEffect(() => {
    inputsRef.current = inputs;
  }, [inputs]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  /** Integrate `realSeconds` of wall-clock time, sub-stepped so no single call to the
   * engine ever exceeds `maxDtSeconds` — the stability bound every engine is written
   * against. Returns the final snapshot, or null if nothing was integrated. */
  const advance = useCallback((realSeconds: number) => {
    const cfg = configRef.current;
    let remaining = realSeconds;
    let result: { state: TState; derived: TDerived } | null = null;

    while (remaining > 0) {
      const chunk = Math.min(remaining, cfg.maxDtSeconds);
      remaining -= chunk;
      result = cfg.step(stateRef.current, inputsRef.current, chunk * cfg.timeScale * speedRef.current);
      stateRef.current = result.state;
      historyRef.current.push(cfg.toHistoryPoint(result));
    }

    return result;
  }, []);

  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    let lastRenderTime = 0;

    function frame(now: number) {
      const cfg = configRef.current;
      const realDtSeconds = Math.min((now - lastTime) / 1000, cfg.maxDtSeconds);
      lastTime = now;

      if (playingRef.current) {
        const result = advance(realDtSeconds);

        if (result && now - lastRenderTime >= cfg.renderIntervalMs) {
          lastRenderTime = now;
          setSnapshot(result);
          setHistory(historyRef.current.toArray());
        }
      }

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally empty: config/inputs are read via refs so the loop never restarts
  }, []);

  const perturb = useCallback((fn: (state: TState) => TState) => {
    const cfg = configRef.current;
    stateRef.current = fn(stateRef.current);
    setSnapshot({
      state: stateRef.current,
      derived: cfg.computeDerived(stateRef.current, inputsRef.current),
    });
  }, []);

  /**
   * Integrate `seconds` of SIMULATED time immediately, without animating it.
   *
   * Pattern-discrimination questions need this. Their fairness is verified against a settled
   * engine, but the page only reset it and started the clock — so a learner was shown an
   * unsettled transient and asked to name a disorder that had not developed yet. At the thyroid
   * axis's time scale, waiting for the panel the harness checked would have taken eleven
   * minutes.
   *
   * Chunked to the engine's own stability bound, exactly as the verification harness settles, so
   * the state a learner reads is the state that was checked.
   */
  const fastForward = useCallback((seconds: number, inputsOverride?: TInputs) => {
    const cfg = configRef.current;
    // `inputsRef` syncs via an effect, so a caller that has just applied a preset and wants it
    // settled in the SAME tick must pass the new inputs explicitly — otherwise this integrates
    // four thousand seconds of the previous scenario. That hazard is documented in CLAUDE.md
    // and it is exactly what happens when a pattern question loads.
    const activeInputs = inputsOverride ?? inputsRef.current;
    let remaining = seconds;
    let state = stateRef.current;
    while (remaining > 0) {
      const dt = Math.min(remaining, cfg.maxDtSeconds);
      remaining -= dt;
      state = cfg.step(state, activeInputs, dt).state;
    }
    stateRef.current = state;
    setSnapshot({ state, derived: cfg.computeDerived(state, activeInputs) });
  }, []);

  const reset = useCallback(() => {
    const cfg = configRef.current;
    stateRef.current = cfg.createInitialState();
    historyRef.current = new RingBuffer<THistoryPoint>(cfg.historyCapacity);
    setSnapshot({
      state: stateRef.current,
      derived: cfg.computeDerived(stateRef.current, inputsRef.current),
    });
    setHistory([]);
  }, []);

  const stepOnce = useCallback(() => {
    if (playingRef.current) return;
    const result = advance(STEP_REAL_SECONDS);
    if (result) {
      setSnapshot(result);
      setHistory(historyRef.current.toArray());
    }
  }, [advance]);

  // Transport writes go to the ref FIRST so the loop and `stepOnce` observe them
  // immediately, then to state for rendering. Syncing via an effect instead would leave a
  // window in which a just-pressed control has not taken effect.
  const setPlayingNow = useCallback((next: boolean) => {
    playingRef.current = next;
    setPlaying(next);
  }, []);

  const transport: SimTransport = {
    playing,
    speed,
    play: useCallback(() => setPlayingNow(true), [setPlayingNow]),
    pause: useCallback(() => setPlayingNow(false), [setPlayingNow]),
    toggle: useCallback(() => setPlayingNow(!playingRef.current), [setPlayingNow]),
    stepOnce,
    setSpeed: useCallback((multiplier: number) => {
      speedRef.current = multiplier;
      setSpeedState(multiplier);
    }, []),
  };

  const baseline: SimBaseline<THistoryPoint> = {
    history: baselineHistory,
    capture: useCallback(() => setBaselineHistory(historyRef.current.toArray()), []),
    clear: useCallback(() => setBaselineHistory(null), []),
  };

  return { snapshot, history, reset, perturb, fastForward, transport, baseline };
}
