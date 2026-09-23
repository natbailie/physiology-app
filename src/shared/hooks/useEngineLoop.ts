import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { seededBuffer, settledOpening } from '@/shared/engine/settle';
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion';

export interface EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint> {
  createInitialState: () => TState;
  step: (state: TState, inputs: TInputs, dtSeconds: number) => { state: TState; derived: TDerived };
  computeDerived: (state: TState, inputs: TInputs) => TDerived;
  toHistoryPoint: (snapshot: { state: TState; derived: TDerived }) => THistoryPoint;
  maxDtSeconds: number;
  renderIntervalMs: number;
  historyCapacity: number;
  timeScale: number;
  /**
   * Simulated seconds of settling applied before the first frame, so a module opens on normal
   * physiology instead of relaxing into it while the learner watches.
   *
   * Every engine starts its reflex and hormone actuators at zero — a fresh `createInitialState()`
   * is a plausible starting point, not a steady state — and at the slow time scales that drift
   * took minutes of real time. Chunked exactly as `verifyQuestion.ts` settles, so what a learner
   * reads on load is the state the verification harness checks.
   */
  settleSeconds?: number;
  /**
   * Whether the learner has asked the OS to reduce motion. Read once at mount and again when
   * Reset restores the mount-time rule, so it must be re-readable rather than a one-shot value.
   *
   * Defaults to the browser's `prefers-reduced-motion` `matchMedia` query. The React Native app
   * passes Reanimated's `useReducedMotion` (a `() => boolean` with the same read-once-at-init
   * semantics), which is what keeps this file — whose only other browser-only call is
   * `requestAnimationFrame`, shared with RN — importable by a bundle with no `window`.
   */
  prefersReducedMotion?: () => boolean;
}

/**
 * Real seconds of wall clock a single frame may contribute. A backgrounded tab, a long GC pause
 * or a slow first paint would otherwise arrive as one enormous catch-up step.
 *
 * This is deliberately NOT `maxDtSeconds`: that is a bound on the SIMULATED dt handed to the
 * engine, and clamping real time against it made every module whose bound is smaller than a
 * frame (membranePotentials at 0.4ms) run far slower than its `timeScale` says it does.
 */
const MAX_FRAME_SECONDS = 0.05;

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
  /** Back to 1x and to the playing state the module mounted with. Part of what the Reset
   * button undoes — a module left at 4x otherwise stays at 4x through a reset. */
  reset: () => void;
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
  /** Back to the engine's initial state, with history discarded. Pass `inputsOverride` when the
   * inputs were changed in the same tick — same hazard `fastForward` documents. */
  reset: (inputsOverride?: TInputs) => void;
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


/** Inputs are flat records of numbers, strings and booleans, so this settles whether anything
 * actually changed. Guards the input effect below against a caller that rebuilds its inputs
 * object without changing a value — which would otherwise be an endless render loop. */
function sameInputs<TInputs>(a: TInputs, b: TInputs): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const keys = Object.keys(a as object);
  if (keys.length !== Object.keys(b as object).length) return false;
  return keys.every((key) => Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]));
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
  // Resolves the effective `prefersReducedMotion` through the ref so the loop's two reads (mount
  // and Reset) stay current without reading `config` directly, and so an RN caller's injected
  // function is re-read like every other piece of config rather than captured once.
  const reducedMotion = useCallback(
    () => (configRef.current.prefersReducedMotion ?? prefersReducedMotion)(),
    [],
  );
  // Lazy initialiser, not `useRef(settledOpening(...))`: a ref's argument is evaluated on every
  // render, which would re-settle the engine on every pointer move of a slider drag.
  const [opening] = useState(() => settledOpening(config, inputs));
  const stateRef = useRef(opening.state);
  const historyRef = useRef(seededBuffer(config.historyCapacity, opening.history));

  const [snapshot, setSnapshot] = useState<{ state: TState; derived: TDerived }>(() => ({
    state: stateRef.current,
    derived: config.computeDerived(stateRef.current, inputs),
  }));
  const [history, setHistory] = useState<THistoryPoint[]>(opening.history);

  // Someone who has asked the OS for reduced motion should not be handed a
  // continuously animating diagram unprompted; they start paused and opt in.
  const [playing, setPlaying] = useState(() => !reducedMotion());
  const [speed, setSpeedState] = useState(1);
  const [baselineHistory, setBaselineHistory] = useState<THistoryPoint[] | null>(null);

  const playingRef = useRef(playing);
  const speedRef = useRef(speed);

  /**
   * Layout effect, and it republishes the snapshot rather than only stashing the ref.
   *
   * Two things were broken by syncing the inputs in a plain effect and waiting for the next
   * engine tick to re-derive. A paused module ignored its sliders completely — the readouts and
   * the diagram did not move until Step was pressed — and a playing one lagged by up to a whole
   * `renderIntervalMs`, which is 100ms on most modules. Running before paint means a drag lands
   * in the same frame it happens in, playing or paused.
   */
  useLayoutEffect(() => {
    const previous = inputsRef.current;
    inputsRef.current = inputs;
    // Nothing to republish on mount, or when a caller rebuilds the object without moving a value.
    if (sameInputs(previous, inputs)) return;
    const cfg = configRef.current;
    setSnapshot((prev) => ({ state: prev.state, derived: cfg.computeDerived(prev.state, inputs) }));
  }, [inputs]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  /** Integrate `realSeconds` of wall-clock time. The real span is converted to simulated time
   * FIRST and sub-stepped after, so no single call to the engine exceeds `maxDtSeconds` — the
   * stability bound every engine is written against — however large `timeScale` is. Returns the
   * final snapshot, or null if nothing was integrated. */
  const advance = useCallback((realSeconds: number) => {
    const cfg = configRef.current;
    let remaining = realSeconds * cfg.timeScale * speedRef.current;
    let result: { state: TState; derived: TDerived } | null = null;

    while (remaining > 0) {
      const chunk = Math.min(remaining, cfg.maxDtSeconds);
      remaining -= chunk;
      result = cfg.step(stateRef.current, inputsRef.current, chunk);
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
      const realDtSeconds = Math.min((now - lastTime) / 1000, MAX_FRAME_SECONDS);
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

  const reset = useCallback((inputsOverride?: TInputs) => {
    const cfg = configRef.current;
    // `inputsRef` syncs via an effect, so the Reset button — which puts the sliders back to the
    // module defaults in the SAME tick — must pass them explicitly. Without it the fresh state
    // is derived against the scenario being reset AWAY from, and a paused module keeps showing
    // the old readouts until something else re-renders it.
    const activeInputs = inputsOverride ?? inputsRef.current;
    const settled = settledOpening(cfg, activeInputs);
    stateRef.current = settled.state;
    historyRef.current = seededBuffer(cfg.historyCapacity, settled.history);
    setSnapshot({
      state: stateRef.current,
      derived: cfg.computeDerived(stateRef.current, activeInputs),
    });
    setHistory(settled.history);
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

  const transportPlay = useCallback(() => setPlayingNow(true), [setPlayingNow]);
  const transportPause = useCallback(() => setPlayingNow(false), [setPlayingNow]);
  const transportToggle = useCallback(() => setPlayingNow(!playingRef.current), [setPlayingNow]);
  const transportSetSpeed = useCallback((multiplier: number) => {
    speedRef.current = multiplier;
    setSpeedState(multiplier);
  }, []);
  // Restores the mount-time rule rather than hard-coding "playing", so a learner who has
  // asked the OS for reduced motion is not handed a running animation by pressing Reset.
  const transportReset = useCallback(() => {
    speedRef.current = 1;
    setSpeedState(1);
    setPlayingNow(!reducedMotion());
  }, [setPlayingNow, reducedMotion]);

  // Memoised: `SimControls` and the pages holding these can only skip a re-render if the
  // object identity survives an engine tick.
  const transport: SimTransport = useMemo(
    () => ({
      playing,
      speed,
      play: transportPlay,
      pause: transportPause,
      toggle: transportToggle,
      stepOnce,
      setSpeed: transportSetSpeed,
      reset: transportReset,
    }),
    [playing, speed, transportPlay, transportPause, transportToggle, stepOnce, transportSetSpeed, transportReset],
  );

  const captureBaseline = useCallback(() => setBaselineHistory(historyRef.current.toArray()), []);
  const clearBaseline = useCallback(() => setBaselineHistory(null), []);
  const baseline: SimBaseline<THistoryPoint> = useMemo(
    () => ({ history: baselineHistory, capture: captureBaseline, clear: clearBaseline }),
    [baselineHistory, captureBaseline, clearBaseline],
  );

  return { snapshot, history, reset, perturb, fastForward, transport, baseline };
}
