import { beforeAll, expect, it } from 'vitest';
import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import type { PatternQuestion } from './types';
import { runPatternQuestion, type PanelCache, type PatternRunResult } from './verifyPattern';

/**
 * Shared assertions for pattern-discrimination questions.
 *
 * The load-bearing one is fairness: the panel shown must separate the answer from every
 * distractor when both are run through the real engine. A question that cannot be reasoned to
 * is worse than no question, and it is exactly the failure an author cannot see by eye.
 */
/**
 * Room for a module whose disorders take simulated days to develop.
 *
 * Vitest's ten-second default is fine for a reflex that settles in a minute and far too tight
 * for the electrolyte engine, which integrates in 0.05-second steps over eleven simulated hours
 * before a hyponatraemia is worth reading. The alternative was to shorten the settle until the
 * suite was fast, which would have meant asking questions about disorders that had not happened.
 */
const SETTLE_TIMEOUT_MS = 180_000;

export function describePatternSet<TState, TInputs, TDerived, THistoryPoint, TPreset extends string>(
  config: EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
  defaultInputs: TInputs,
  presets: Record<TPreset, Partial<TInputs>>,
  questions: readonly PatternQuestion<TPreset, { state: TState; derived: TDerived }>[],
): void {
  const results = new Map<string, PatternRunResult<TPreset>>();

  beforeAll(() => {
    const cache: PanelCache = new Map();
    for (const question of questions) {
      results.set(question.id, runPatternQuestion(config, defaultInputs, presets, question, cache));
    }
  }, SETTLE_TIMEOUT_MS);

  const resultFor = (id: string): PatternRunResult<TPreset> => {
    const result = results.get(id);
    if (!result) throw new Error(`no run recorded for question "${id}"`);
    return result;
  };

  it('has unique question ids', () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('always offers the answer among the options', () => {
    for (const question of questions) {
      expect(question.options, `${question.id}`).toContain(question.answer);
    }
  });

  it('offers enough options to be worth answering, with no duplicates', () => {
    for (const question of questions) {
      expect(question.options.length, `${question.id}`).toBeGreaterThanOrEqual(3);
      expect(new Set(question.options).size, `${question.id} duplicates`).toBe(question.options.length);
    }
  });

  it('gives every question a stem, a panel and an explanation worth reading', () => {
    for (const question of questions) {
      expect(question.stem.length, `${question.id} stem`).toBeGreaterThan(40);
      expect(question.panel.length, `${question.id} panel`).toBeGreaterThanOrEqual(3);
      expect(question.explanation.length, `${question.id} explanation`).toBeGreaterThan(120);
    }
  });

  it('produces finite panel values for every option', () => {
    for (const question of questions) {
      for (const [option, readings] of resultFor(question.id).panels) {
        for (const reading of readings) {
          expect(
            Number.isFinite(reading.value),
            `${question.id} / ${option} / ${reading.label}`,
          ).toBe(true);
        }
      }
    }
  });

  it('shows a panel that actually separates the answer from every distractor', () => {
    const unfair = questions
      .map((question) => ({ question, result: resultFor(question.id) }))
      .filter(({ result }) => result.indistinguishable.length > 0)
      .map(
        ({ question, result }) =>
          `  ${question.id}: cannot be told apart from ${result.indistinguishable.join(', ')}`,
      );

    expect(unfair.join('\n'), `unanswerable question(s):\n${unfair.join('\n')}`).toBe('');
  });
}
