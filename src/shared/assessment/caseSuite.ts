import { beforeAll, expect, it } from 'vitest';
import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import type { ModuleCase } from '@/shared/cases/types';
import { DEFAULT_TOLERANCE } from './types';
import { readPanel, type PanelCache, type PanelReading } from './verifyPattern';

/** Room for a module whose disorders take simulated days. Same reasoning as `patternSuite`. */
const SETTLE_TIMEOUT_MS = 180_000;

/** Simulated seconds to settle a bed before reading its chart, when a module says nothing. */
const DEFAULT_CASE_SETTLE = 600;

export interface CaseSuiteOptions<TPreset extends string> {
  /** The scenario a healthy version of this patient would be. Every module has one; the name
   * differs, so it is named rather than guessed. */
  healthyPreset: TPreset;
  settleSeconds?: number;
  /** The module's question ids, so a case cannot collect a question that does not exist. */
  questionIds?: readonly string[];
}

/**
 * Shared assertions for a module's patient cases.
 *
 * The load-bearing one is the first: **a patient's chart has to separate them from a healthy
 * person.** That is the case-shaped version of the fairness check pattern questions get, and it
 * catches the authoring error that actually happens — a bed whose observations, once the engine
 * has settled, read completely normal. An author cannot see that by eye, because the numbers
 * are not in the file; that is the point of `chart` being accessors, and this is the other half
 * of the bargain.
 *
 * Everything here runs through the real engine, so these are claims about the simulator rather
 * than about the prose.
 */
export function describeCaseSet<TState, TInputs, TDerived, THistoryPoint, TPreset extends string>(
  config: EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
  defaultInputs: TInputs,
  presets: Record<TPreset, Partial<TInputs>>,
  cases: readonly ModuleCase<TPreset, { state: TState; derived: TDerived }>[],
  options: CaseSuiteOptions<TPreset>,
): void {
  const seconds = options.settleSeconds ?? DEFAULT_CASE_SETTLE;
  const charts = new Map<string, PanelReading[]>();
  const healthy = new Map<string, PanelReading[]>();

  beforeAll(() => {
    const cache: PanelCache = new Map();
    for (const patient of cases) {
      // Keyed on scenario, chart shape and settle: two beds drawn from one preset and one
      // panel — which is the common shape — settle once between them.
      const shape = patient.chart.map((f) => f.label).join(',');
      const key = `${patient.preset}|${shape}|${seconds}`;
      const chart =
        cache.get(key) ?? readPanel(config, defaultInputs, presets, patient.chart, patient.preset, seconds);
      cache.set(key, chart);
      charts.set(patient.id, chart);

      const wellKey = `${options.healthyPreset}|${shape}|${seconds}`;
      const well =
        cache.get(wellKey) ??
        readPanel(config, defaultInputs, presets, patient.chart, options.healthyPreset, seconds);
      cache.set(wellKey, well);
      healthy.set(patient.id, well);
    }
  }, SETTLE_TIMEOUT_MS);

  const chartFor = (id: string): PanelReading[] => {
    const chart = charts.get(id);
    if (!chart) throw new Error(`no chart settled for case "${id}"`);
    return chart;
  };

  it('names a scenario the module actually has', () => {
    // Not redundant with the type. A module whose presets are declared as
    // `Record<string, Partial<Inputs>>` widens its own preset name to `string`, so a renamed
    // or mistyped scenario compiles cleanly and produces a bed of undefined inputs.
    for (const patient of cases) {
      expect(presets[patient.preset], `${patient.id} -> "${patient.preset}"`).toBeDefined();
    }
  });

  it('has unique case ids', () => {
    const ids = cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /** Two patients in one bed is the kind of detail that makes a fiction stop working. */
  it('puts every patient in a bed of their own', () => {
    const beds = cases.map((c) => c.bed);
    expect(beds.filter((b) => b.trim() === ''), 'a case with no bed').toEqual([]);
    expect(new Set(beds).size, `duplicate beds: ${beds.join(', ')}`).toBe(beds.length);
  });

  it('gives every bed a chart worth reading', () => {
    for (const patient of cases) {
      expect(patient.chart.length, `${patient.id} chart`).toBeGreaterThanOrEqual(3);
    }
  });

  it('produces finite observations for every bed', () => {
    for (const patient of cases) {
      for (const reading of chartFor(patient.id)) {
        expect(Number.isFinite(reading.value), `${patient.id} / ${reading.label}`).toBe(true);
      }
    }
  });

  /**
   * The assertion this file exists for.
   *
   * A case is a claim that something is wrong with somebody. If every row of the chart settles
   * within tolerance of the healthy scenario, the claim is false — whatever the prose says —
   * and the learner is being asked to find a pattern that is not on the screen.
   */
  it('shows a chart that separates the patient from a healthy one', () => {
    const indistinguishable = cases
      .filter((patient) => {
        const ill = chartFor(patient.id);
        const well = healthy.get(patient.id) ?? [];
        return patient.chart.every((field, index) => {
          const a = ill[index]?.value ?? 0;
          const b = well[index]?.value ?? 0;
          const scale = Math.max(Math.abs(a), Math.abs(b), 1e-9);
          return Math.abs(a - b) / scale < (field.tolerance ?? DEFAULT_TOLERANCE);
        });
      })
      .map((patient) => `  ${patient.id}: reads the same as "${options.healthyPreset}"`);

    expect(indistinguishable.join('\n'), `bed(s) with nothing wrong:\n${indistinguishable.join('\n')}`).toBe('');
  });

  it('collects only questions the module actually has', () => {
    if (!options.questionIds) return;
    const known = new Set(options.questionIds);
    for (const patient of cases) {
      for (const id of patient.questionIds ?? []) {
        expect(known.has(id), `${patient.id} collects unknown question "${id}"`).toBe(true);
      }
    }
  });

  /** The prose is the product, the same way a question explanation is. These are the floors
   * `patternSuite` applies to a stem and an explanation, in the shapes a bed needs. */
  it('gives every patient a history and a payoff worth reading', () => {
    for (const patient of cases) {
      expect(patient.oneLiner.length, `${patient.id} oneLiner too long for a bed card`).toBeLessThan(80);
      expect(patient.oneLiner.length, `${patient.id} oneLiner`).toBeGreaterThan(10);
      expect(patient.presentation.length, `${patient.id} presentation`).toBeGreaterThan(120);
      expect(patient.teaching.length, `${patient.id} teaching`).toBeGreaterThan(120);
      expect(patient.task.length, `${patient.id} task`).toBeGreaterThan(20);
      expect(patient.age, `${patient.id} age`).toBeGreaterThan(0);
      expect(patient.age, `${patient.id} age`).toBeLessThan(111);
    }
  });
}
