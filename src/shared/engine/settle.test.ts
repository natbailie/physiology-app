import { describe, expect, it } from 'vitest';
import { seededBuffer, settledOpening, type SettleableConfig } from './settle';
import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';

/**
 * What a module looks like in the first frame a learner sees.
 *
 * Two failures this is written against, both of which the app shipped with. A module that opens on
 * `createInitialState()` climbs to its resting values while somebody watches — that is what
 * `settleSeconds` fixed, and what `controls.test.tsx` holds. And a module that opens on an EMPTY
 * history sweeps: `Sparkline` normalises x against the points it has, so two points draw a line
 * across the frame and every tick after compresses it. Recording the tail of the settle fixes the
 * second, and the assertions below are about the recording being faithful rather than decorative.
 */

const configModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/loopConfig.ts', { eager: true });
const presetModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/presets.ts', { eager: true });

type AnyConfig = EngineLoopConfig<unknown, unknown, unknown, unknown>;
type Inputs = Record<string, unknown>;

function findByShape<T>(exports: Record<string, unknown>, ok: (value: unknown) => boolean): T | null {
  for (const value of Object.values(exports)) if (ok(value)) return value as T;
  return null;
}

// Discovered the same way `controls.test.tsx` discovers them, and for the same reason: a
// hand-maintained list of module ids would be the one that silently under-reports.
const modules = Object.entries(configModules).map(([path, exports]) => {
  const presetExports = presetModules[path.replace('loopConfig', 'presets')]!;
  return {
    id: path.match(/modules\/([^/]+)\//)![1]!,
    config: findByShape<AnyConfig>(exports, (v) => !!v && typeof v === 'object' && 'step' in v && 'computeDerived' in v)!,
    defaults: findByShape<Inputs>(
      Object.fromEntries(Object.entries(presetExports).filter(([name]) => /^DEFAULT_/.test(name))),
      (v) => !!v && typeof v === 'object' && !Array.isArray(v),
    )!,
  };
});

/**
 * Modules whose settle is too short to fill their own chart, so they open on a trace that is still
 * growing in from the left. One, and honest: respiratoryFailure reaches its resting state in half a
 * simulated second, which is thirty of its chart's hundred and twenty points. `Sparkline`'s
 * `capacity` is what draws that growing in from the left rather than stretched across the frame.
 *
 * A list rather than a tolerance, because the way this goes wrong is silently — a settle shortened
 * during calibration takes the opening trace with it, and nothing else on screen would say so.
 */
const PARTIAL_OPENING_TRACE = ['respiratoryFailure'];

describe('settledOpening', () => {
  it('found every module', () => {
    expect(modules.length).toBeGreaterThanOrEqual(51);
  });

  it('fills the chart on every settled module but the one that cannot', () => {
    const partial = modules
      .filter(({ config }) => config.settleSeconds)
      .filter(({ config, defaults }) => settledOpening(config, defaults).history.length < config.historyCapacity)
      .map(({ id }) => id)
      .sort();
    expect(partial).toEqual(PARTIAL_OPENING_TRACE);
  });

  describe.each(modules)('$id', ({ config, defaults }) => {
    const inputs = defaults;

    it('opens on a full trace when it settles, and on none when it does not', () => {
      const { history } = settledOpening(config as SettleableConfig<unknown, unknown, unknown, unknown>, inputs);
      if (!config.settleSeconds) {
        // A trajectory module has no resting state to record; seeding one would jump past the
        // thing the module is about. Its chart grows in from the left instead, via `capacity`.
        expect(history).toEqual([]);
        return;
      }
      expect(history.length).toBeGreaterThan(0);
      expect(history.length).toBeLessThanOrEqual(config.historyCapacity);
    });

    it('opens on a trace that is already steady', () => {
      // The point of the whole exercise. A recording that began before the module had settled would
      // just relocate the climb from the readouts into the left-hand half of the chart, which is
      // the same unfinished look in a different place.
      //
      // Asked as CONTAINMENT — is every seeded value inside the band the module occupies once it is
      // running — rather than by comparing the recording's two halves. Half the settled modules open
      // onto a LIMIT CYCLE whose period is longer than the window: respiratoryMechanics records 2.4
      // simulated seconds of a 4.3-second breath, so its two halves are inspiration and expiration
      // and differ completely while nothing at all is drifting. A trace that is still climbing sits
      // BELOW the band at its left-hand end, which containment catches and phase does not fake.
      const { state, history } = settledOpening(config as SettleableConfig<unknown, unknown, unknown, unknown>, inputs);
      if (history.length < 8) return;
      const escape = worstEscape(envelope(history), envelope(runningBand(config, inputs, state)));
      expect(escape.value, `seeded trace leaves the running band (worst: ${escape.key})`).toBeLessThan(0.05);
    });

    it('hands out a copy, so one mount cannot write into the next', () => {
      const first = settledOpening(config as SettleableConfig<unknown, unknown, unknown, unknown>, inputs);
      const second = settledOpening(config as SettleableConfig<unknown, unknown, unknown, unknown>, inputs);
      expect(second.history).toEqual(first.history);
      expect(second.history).not.toBe(first.history);
    });
  });
});

/**
 * Elapsed time and clock positions are excluded for the reason `controls.test.tsx` excludes them:
 * each is a ramp or a sawtooth saying WHEN the sample was taken, not what the physiology is doing,
 * and every seeded point would sit below a band recorded after it however still the module was.
 * The floor keeps a quantity wandering by four ten-thousandths of a 0..1 range from being called a
 * 26% escape.
 */
const CLOCK_KEY = /^t$|time|phase|cycleday|ramp|elapsed/i;

function envelope(points: readonly unknown[]): Record<string, { low: number; high: number }> {
  const out: Record<string, { low: number; high: number }> = {};
  for (const point of points) {
    if (!point || typeof point !== 'object') continue;
    for (const [key, value] of Object.entries(point)) {
      if (typeof value !== 'number' || !Number.isFinite(value) || CLOCK_KEY.test(key)) continue;
      const seen = out[key];
      out[key] = seen ? { low: Math.min(seen.low, value), high: Math.max(seen.high, value) } : { low: value, high: value };
    }
  }
  return out;
}

/**
 * The band the module occupies once it is running: six recording windows' worth of history taken
 * from the state the learner opens on. Six because the reference has to span several periods of
 * whatever the slowest cycle in the module is — one window is by construction the length that was
 * too short to judge phase against.
 */
function runningBand(cfg: AnyConfig, inputs: Inputs, from: unknown): unknown[] {
  const perPoint = Math.min(cfg.maxDtSeconds, cfg.timeScale / 60);
  const span = Math.min((cfg.settleSeconds ?? 0) / 2, cfg.historyCapacity * perPoint) * 6;
  const points: unknown[] = [];
  let state = from;
  for (let elapsed = 0; elapsed < span; elapsed += perPoint) {
    const snapshot = cfg.step(state, inputs, perPoint);
    state = snapshot.state;
    points.push(cfg.toHistoryPoint(snapshot));
  }
  return points;
}

/** How far the seeded trace's worst value falls outside the running band, as a fraction. */
function worstEscape(
  seeded: Record<string, { low: number; high: number }>,
  band: Record<string, { low: number; high: number }>,
): { key: string; value: number } {
  let worst = { key: 'none', value: 0 };
  for (const [key, range] of Object.entries(seeded)) {
    const reference = band[key];
    if (!reference) continue;
    const scale = Math.max(Math.abs(reference.low), Math.abs(reference.high), reference.high - reference.low, 0.01);
    for (const [edge, over] of [
      ['low', reference.low - range.low],
      ['high', range.high - reference.high],
    ] as const) {
      const escape = Math.max(0, over) / scale;
      if (escape > worst.value) worst = { key: `${key}.${edge}`, value: escape };
    }
  }
  return worst;
}

describe('seededBuffer', () => {
  it('holds the opening trace in chronological order', () => {
    expect(seededBuffer(4, [1, 2, 3]).toArray()).toEqual([1, 2, 3]);
  });

  it('keeps the newest when the seed is longer than the buffer', () => {
    expect(seededBuffer(2, [1, 2, 3]).toArray()).toEqual([2, 3]);
  });
});
