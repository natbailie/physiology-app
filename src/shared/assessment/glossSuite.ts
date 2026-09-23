import { describe, expect, it } from 'vitest';
import type { PatternQuestion } from './types';

/**
 * A gloss says what a scenario IS, never what its numbers do.
 *
 * The distinction is the whole point. "Obstructive — blocked filling, high CVP" printed under an
 * option would answer a pattern question from the options alone, without reading the panel it is
 * asked against, and "never print the answer during practice" is not negotiable. Naming a panel
 * row, or quoting a figure, is how that happens.
 *
 * The fourth check is the one that is easy to miss, because it leaks through LAYOUT rather than
 * through wording: in a row of four options where three carry a line of prose and the fourth sits
 * bare, the bare one is marked as different before a word of it is read. Five of the seven gaps
 * this test was written against were the module's own healthy preset — the option a learner most
 * needs not to be able to pick out by its shape.
 *
 * **The panels come from the questions, not from a list the caller passes.** Every
 * `PatternQuestion` already carries the rows it is marked against, so a union over the set cannot
 * go stale, and `vision` — whose questions are asked against three different panels — needs no
 * special case.
 */
export function describeGlossSet<TPreset extends string, TSnapshot>(
  gloss: Partial<Record<TPreset, string>>,
  presets: Record<TPreset, unknown>,
  questions: readonly PatternQuestion<TPreset, TSnapshot>[],
): void {
  const entries = Object.entries(gloss) as [TPreset, string][];
  const rows = [...new Set(questions.flatMap((q) => q.panel.map((f) => f.label.toLowerCase())))];
  const offered = [...new Set(questions.flatMap((q) => q.options))];

  describe('the option glosses', () => {
    it('names no row of a panel its questions are asked against', () => {
      const leaks = entries.flatMap(([preset, text]) =>
        rows.filter((row) => text.toLowerCase().includes(row)).map((row) => `${preset} names "${row}"`),
      );
      expect(leaks.join('; '), `glosses reporting the panel: ${leaks.join('; ')}`).toBe('');
    });

    it('quotes no figures', () => {
      const numeric = entries.filter(([, text]) => /[0-9]/.test(text)).map(([preset]) => preset);
      expect(numeric.join(', '), `glosses containing a number: ${numeric.join(', ')}`).toBe('');
    });

    it('only glosses scenarios the module actually has', () => {
      for (const [preset] of entries) expect(presets[preset], preset).toBeDefined();
    });

    it('glosses every option a pattern question offers', () => {
      const bare = offered.filter((preset) => !gloss[preset]);
      expect(bare.join(', '), `options rendering without a gloss beside glossed siblings: ${bare.join(', ')}`).toBe('');
    });
  });
}
