import { describe, expect, it } from 'vitest';
import { provenanceCoverage, type ReferenceRanges } from '@/shared/validation/referenceRange';
import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';

/**
 * Proves that every module's baseline lands inside a band somebody can check, and that the band
 * says where it came from.
 *
 * The engines were calibrated against textbook values we chose, and for forty of the forty-five
 * modules that calibration existed only as a bare numeric literal inside a test. No test file
 * outside the five Pulse-oracle modules cited a source at all — not a textbook, not a guideline,
 * not a DOI — and the word "textbook" appeared in a dozen test titles without ever naming which
 * one. That is not nothing, but it is not something a reviewer can check either.
 *
 * `shockStates` had already worked out the answer for one module: `engine/references.ts` pairs each
 * asserted band with a `Provenance` saying whether it is corroborated by an independently validated
 * engine, by a citation, or by nothing yet. This generalises that to all of them.
 *
 * The point is NOT to make every band look sourced. `kind: 'unsourced'` is a first-class outcome
 * and carries a `needs` describing what would settle it, because an honest gap is worth more than
 * a uniform citation list that would not survive being audited. What this file enforces is that
 * the gap is VISIBLE and that the number is inside its own band.
 */

type AnyConfig = EngineLoopConfig<unknown, unknown, unknown, unknown>;
type Inputs = Record<string, unknown>;

const configModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/loopConfig.ts', { eager: true });
const presetModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/presets.ts', { eager: true });
const referenceModules = import.meta.glob<Record<string, unknown>>('../../modules/*/engine/references.ts', { eager: true });

const moduleIdOf = (path: string): string => path.match(/modules\/([^/]+)\//)![1]!;

function findByShape<T>(exports: Record<string, unknown>, ok: (value: unknown) => boolean): T | null {
  for (const value of Object.values(exports)) if (ok(value)) return value as T;
  return null;
}

interface ModuleUnderTest {
  id: string;
  config: AnyConfig;
  defaults: Inputs;
  ranges: ReferenceRanges | null;
}

const modules: ModuleUnderTest[] = Object.entries(configModules)
  .map(([path, exports]) => {
    const id = moduleIdOf(path);
    const presetExports = presetModules[path.replace('loopConfig', 'presets')]!;
    const referenceExports = referenceModules[path.replace('loopConfig', 'references')];
    return {
      id,
      config: findByShape<AnyConfig>(exports, (v) => !!v && typeof v === 'object' && 'step' in v && 'computeDerived' in v)!,
      defaults: findByShape<Inputs>(
        Object.fromEntries(Object.entries(presetExports).filter(([name]) => /^DEFAULT_/.test(name))),
        (v) => !!v && typeof v === 'object' && !Array.isArray(v),
      )!,
      ranges:
        (Object.entries(referenceExports ?? {}).find(([name]) => /REFERENCE_RANGES$/.test(name))?.[1] as ReferenceRanges) ??
        null,
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

/** Chunked exactly as `useEngineLoop` settles and as the control sweep settles, so the value under
 * test is the one a learner reads on load. */
function settle(config: AnyConfig, inputs: unknown, seconds: number): Record<string, unknown> {
  let state = config.createInitialState();
  const dt = config.maxDtSeconds;
  const steps = Math.min(Math.ceil(seconds / dt), 60_000);
  let derived = config.computeDerived(state, inputs) as Record<string, unknown>;
  for (let i = 0; i < steps; i++) {
    const result = config.step(state, inputs, dt) as { state: unknown; derived: Record<string, unknown> };
    state = result.state;
    derived = result.derived;
  }
  return derived;
}

describe('every module says where its numbers came from', () => {
  it('discovered every module', () => {
    expect(modules.length).toBeGreaterThanOrEqual(45);
  });

  it('gives every module a references.ts — no silent opt-out', () => {
    const missing = modules.filter((m) => !m.ranges).map((m) => m.id);
    expect(missing, `modules with no engine/references.ts:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  describe.each(modules.map((m) => [m.id, m] as const))('%s', (id, module) => {
    it('states a band, a unit and a provenance for every quantity', () => {
      const ranges = module.ranges!;
      expect(Object.keys(ranges).length, `${id}: references.ts names no quantities`).toBeGreaterThan(0);
      for (const [key, range] of Object.entries(ranges)) {
        expect(range.low, `${id}.${key}: low must be below high`).toBeLessThan(range.high);
        expect(range.unit.length, `${id}.${key}: needs a unit`).toBeGreaterThan(0);
        if (range.provenance.kind === 'unsourced') {
          // An unsourced band must say what would settle it, so it reads as a work item rather
          // than a shrug. Same floor `shockStates` used before this was generalised.
          expect(range.provenance.needs.length, `${id}.${key}: an unsourced band must say what it needs`).toBeGreaterThan(40);
        }
      }
    });

    it('names a quantity the engine actually produces', () => {
      // A band keyed to a field that does not exist asserts nothing at all, which is worse than
      // having no band: it reads as coverage and is not.
      const derived = settle(module.config, module.defaults, module.config.settleSeconds ?? 600);
      const unknownKeys = Object.keys(module.ranges!).filter((key) => typeof derived[key] !== 'number');
      expect(unknownKeys, `${id}: bands naming no numeric derived field:\n  ${unknownKeys.join('\n  ')}`).toEqual([]);
    });

    it('settles a normal patient inside every band', () => {
      const derived = settle(module.config, module.defaults, module.config.settleSeconds ?? 600);
      const outside = Object.entries(module.ranges!)
        .filter(([key, range]) => {
          const value = derived[key] as number;
          return value < range.low || value > range.high;
        })
        .map(([key, range]) => `${key} = ${(derived[key] as number).toFixed(3)} ${range.unit}, band ${range.low}-${range.high}`);
      expect(outside, `${id}: baseline readings outside their referenced band:\n  ${outside.join('\n  ')}`).toEqual([]);
    });
  });

  /**
   * Repo-wide provenance, reported rather than merely asserted.
   *
   * The floor only ever moves up: a module that gains a citation should never quietly lose one.
   *
   * It currently stands at 236 of 265 bands. The 29 that name no source are not an oversight — they
   * are the quantities this app expresses as a 0-1 or 0-100 index, where no published reference
   * interval CAN be applied until the engine changes units. Each one says so, and says what would
   * settle it. Reading those `needs` strings end to end is the most useful validation backlog in
   * the repo.
   */
  it('reports how much of the app is externally anchored', () => {
    const totals = modules.reduce(
      (acc, m) => {
        const coverage = provenanceCoverage(m.ranges!);
        return { total: acc.total + coverage.total, corroborated: acc.corroborated + coverage.corroborated };
      },
      { total: 0, corroborated: 0 },
    );
    const percent = Math.round((totals.corroborated / totals.total) * 100);
    expect(
      percent,
      `only ${totals.corroborated} of ${totals.total} asserted bands name a source (${percent}%) — this floor should only ever rise`,
    ).toBeGreaterThanOrEqual(89);
  });
});
