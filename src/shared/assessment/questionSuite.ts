import { expect, it } from 'vitest';
import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import type { PredictQuestion } from './types';
import { runQuestion } from './verifyQuestion';

/**
 * Shared assertions every module's question set must satisfy.
 *
 * The important one is the last: each question is answered by RUNNING the engine, so the
 * keyed direction is a fact about the model rather than an author's recollection. If tuning
 * a constant flips an outcome, the question that taught it fails loudly.
 */
export function describeQuestionSet<TState, TInputs, TDerived, THistoryPoint, TPreset extends string>(
  config: EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
  defaultInputs: TInputs,
  presets: Record<TPreset, Partial<TInputs>>,
  questions: readonly PredictQuestion<TInputs, TPreset, { state: TState; derived: TDerived }>[],
): void {
  it('has unique question ids', () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every question a stem, a prompt and an explanation worth reading', () => {
    for (const question of questions) {
      expect(question.stem.length, `${question.id} stem`).toBeGreaterThan(40);
      expect(question.prompt.length, `${question.id} prompt`).toBeGreaterThan(10);
      // The explanation is the product. A one-liner here would defeat the point of the format.
      expect(question.explanation.length, `${question.id} explanation`).toBeGreaterThan(120);
      expect(question.watch.length, `${question.id} watch`).toBeGreaterThan(1);
    }
  });

  it('produces a finite metric that actually responds to the intervention', () => {
    for (const question of questions) {
      const result = runQuestion(config, defaultInputs, presets, question);
      expect(Number.isFinite(result.before), `${question.id} before`).toBe(true);
      expect(Number.isFinite(result.after), `${question.id} after`).toBe(true);
    }
  });

  it('keys the direction the engine actually produces', () => {
    // Collect every mismatch before failing. Stopping at the first one hides the rest, and
    // when a shared constant shifts it is the PATTERN of breakage that identifies the cause.
    const mismatches = questions
      .map((question) => ({ question, result: runQuestion(config, defaultInputs, presets, question) }))
      .filter(({ question, result }) => result.observed !== question.correctDirection)
      .map(
        ({ question, result }) =>
          `  ${question.id}: keyed "${question.correctDirection}" but ${question.watch} went ` +
          `${result.before.toFixed(3)} -> ${result.after.toFixed(3)} ("${result.observed}")`,
      );

    expect(mismatches.join('\n'), `question(s) disagree with the engine:\n${mismatches.join('\n')}`).toBe('');
  });

  it('moves the watched quantity enough for a learner to actually see it', () => {
    // A prediction the learner cannot observe playing out is a worse question than no question,
    // so a keyed direction must come with a visible excursion. Note `observeSeconds` is SIMULATED
    // time: divide by the module's timeScale for how long the learner actually waits, which
    // differs hugely between modules (electrolyte runs at 3600x, respiratory at 6x).
    const invisible = questions
      .filter((question) => question.correctDirection !== 'unchanged')
      .map((question) => ({ question, result: runQuestion(config, defaultInputs, presets, question) }))
      .filter(({ question, result }) => {
        const scale = Math.max(Math.abs(result.before), 1e-9);
        return Math.abs(result.after - result.before) / scale < (question.tolerance ?? 0.05);
      })
      .map(({ question }) => `  ${question.id}`);

    expect(invisible.join('\n'), `change too small to watch:\n${invisible.join('\n')}`).toBe('');
  });
}
