import { RingBuffer } from '@/shared/lib/ringBuffer';

/**
 * Opening a module on its resting physiology — the state AND the trace.
 *
 * Two things used to happen in the first seconds of every module, and both read as the instrument
 * warming up rather than as a patient lying still. The readouts climbed, because a fresh
 * `createInitialState()` starts every reflex and hormone actuator at zero and is a plausible
 * starting point rather than a steady state. And the chart swept, because history began empty: a
 * `Sparkline` normalises x against the points it HAS, so two points draw a line across the whole
 * frame and every tick after that compresses it leftwards until the buffer is full.
 *
 * Settling fixed the first for the 34 modules that declare `settleSeconds`. This fixes the second
 * for all of them, by recording the tail of the settle instead of throwing it away, so a module
 * opens on a full trace of the resting state it is already showing.
 *
 * Deliberately pure, deliberately free of React and of anything browser-only: this is the one
 * implementation, file-synced into the native app, so the phone and the web open identically.
 */

/**
 * The structural subset of a loop config this needs. Stated here rather than imported so that the
 * web's loop config and the phone's — two implementations of one contract, and renamed by the sync
 * script as it copies — both satisfy it without either side importing the other's hook.
 */
export interface SettleableConfig<TState, TInputs, TDerived, THistoryPoint> {
  createInitialState: () => TState;
  step: (state: TState, inputs: TInputs, dtSeconds: number) => { state: TState; derived: TDerived };
  toHistoryPoint: (snapshot: { state: TState; derived: TDerived }) => THistoryPoint;
  maxDtSeconds: number;
  historyCapacity: number;
  timeScale: number;
  settleSeconds?: number;
}

export interface SettledOpening<TState, THistoryPoint> {
  /** The state the module opens on. */
  state: TState;
  /** Chronological, oldest first, at most `historyCapacity` long. Empty when nothing was settled. */
  history: THistoryPoint[];
}

/**
 * The frame the recording pass pretends to be running at. The live loop pushes one history point
 * per engine sub-step, and a sub-step is `min(maxDtSeconds, frameSeconds * timeScale)` — so
 * recording at any other cadence would seed a trace whose time-per-point differs from the live one,
 * and an oscillating quantity would appear to change frequency as the seeded points scrolled off.
 * Half the modules are bounded by the frame rather than by `maxDtSeconds`, so this is not academic.
 */
const NOMINAL_FRAME_SECONDS = 1 / 60;

/**
 * Settling is pure but not free — the slowest modules integrate tens of thousands of steps — and it
 * is re-run on every mount and every Reset. Keyed by config object, then by the inputs it was
 * settled against, so a remount or a reset back to defaults costs nothing. The native app had no
 * cache at all and paid `adrenalCortex`'s 36000 simulated seconds on every single open.
 */
const cache = new WeakMap<object, Map<string, unknown>>();

/**
 * The step the settle takes, and how much of it is kept as the opening trace.
 *
 * The step size is the whole of the point. The live loop sub-steps at
 * `min(maxDtSeconds, frame * timeScale)` — smaller than `maxDtSeconds` for half the modules — and
 * an engine can be sensitive to which. muscleContraction is the worked example: settled in its 33ms
 * chunks it holds a tension of 9.6, and the moment the loop takes over at 0.8ms sub-steps that
 * relaxes to 0.12. At its `timeScale` of 0.05 the drop takes five real seconds, so an unstimulated
 * muscle opened with a tension that visibly fell away. That is the artefact this file exists to
 * remove, and it is not caused by the settle being too short.
 *
 * So the settle runs at the loop's own step from the first chunk to the last. The module hands over
 * already holding the state the loop will maintain, and the total simulated time is still exactly
 * `settleSeconds` — which is what keeps the promise that what a learner reads on load is the state
 * the verification harness checks, rather than a scenario that has quietly run on further.
 */
function settlePlan(cfg: { maxDtSeconds: number; historyCapacity: number; timeScale: number; settleSeconds?: number }) {
  return { perPoint: Math.min(cfg.maxDtSeconds, NOMINAL_FRAME_SECONDS * cfg.timeScale) };
}

export function settledOpening<TState, TInputs, TDerived, THistoryPoint>(
  cfg: SettleableConfig<TState, TInputs, TDerived, THistoryPoint>,
  inputs: TInputs,
): SettledOpening<TState, THistoryPoint> {
  const seconds = cfg.settleSeconds ?? 0;
  // A module whose baseline is a TRAJECTORY declares no settle — cellCycle progresses through
  // phases, micturition fills a bladder. There is no resting state to record, and seeding one
  // would jump past the thing the module is about.
  if (seconds <= 0) return { state: cfg.createInitialState(), history: [] };

  const key = JSON.stringify(inputs);
  let perConfig = cache.get(cfg);
  if (!perConfig) {
    perConfig = new Map<string, unknown>();
    cache.set(cfg, perConfig);
  }
  const cached = perConfig.get(key) as SettledOpening<TState, THistoryPoint> | undefined;
  // Copied on the way out: the caller pushes this into a RingBuffer and hands it to setState, and a
  // shared array would let one module's live trace write into every later mount's opening.
  if (cached) return { state: cached.state, history: [...cached.history] };

  // One pass, at the loop's own step, with the buffer keeping the tail — so the trace a module
  // opens on is literally the last `historyCapacity` steps of its own settling.
  const { perPoint } = settlePlan(cfg);
  const buffer = seededBuffer<THistoryPoint>(cfg.historyCapacity, []);
  let state = cfg.createInitialState();
  for (let elapsed = 0; elapsed < seconds; elapsed += perPoint) {
    const snapshot = cfg.step(state, inputs, Math.min(perPoint, seconds - elapsed));
    state = snapshot.state;
    buffer.push(cfg.toHistoryPoint(snapshot));
  }
  const history = buffer.toArray();

  const opening = { state, history };
  perConfig.set(key, opening);
  return { state, history: [...history] };
}

/**
 * A history buffer that already holds the opening trace. Both loops seed on mount and again on
 * Reset, so a preset press — which resets with new inputs — arrives on a full trace too, rather
 * than blanking the chart the learner is being asked to read.
 */
export function seededBuffer<THistoryPoint>(capacity: number, seed: THistoryPoint[]): RingBuffer<THistoryPoint> {
  const buffer = new RingBuffer<THistoryPoint>(capacity);
  for (const point of seed) buffer.push(point);
  return buffer;
}
