import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Node environment, deliberately: under jsdom `import.meta.url` is an http URL and
// `fileURLToPath` refuses it, so a stylesheet assertion cannot live beside a render test.

/**
 * Every surface that prints a number on `--readout-ink`, held to the size its contrast floor
 * assumes.
 *
 * `palette.test.ts` measures the signal colours against `--readout-ink` at 3:1 rather than 4.5:1.
 * That is WCAG's LARGE-text floor, and it is the honest bar only while the numeral is genuinely
 * ≥18.66px BOLD. Print one small and the floor silently becomes the wrong one, with nothing
 * failing — so the sizes are asserted here, where they are set.
 *
 * A TABLE rather than one test per component, because the rule outgrew its first home. It began
 * in CaseHeader, moved to ClinicPanel with the chart, and ReadoutItem is about to become the
 * third — and the first to actually put a signal colour on that ground. A per-component file
 * would have to be remembered each time; a row in this list is the thing to add.
 */
const SURFACES = [
  { css: '../shared/components/ClinicPanel/ClinicPanel.module.css', rule: 'rowValue' },
  { css: '../shared/components/ReadoutItem/ReadoutItem.module.css', rule: 'value' },
  { css: '../shared/components/QuestionSet/QuestionSet.module.css', rule: 'rowValue' },
] as const;

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

describe.each(SURFACES)('$rule on the instrument ground', ({ css, rule }) => {
  const source = read(css);
  const block = source.match(new RegExp(`\\.${rule} \\{[^}]*\\}`))?.[0] ?? '';

  it('has the rule at all, so the assertions below are not vacuous', () => {
    expect(block, `.${rule} rule exists in ${css}`).not.toBe('');
  });

  it('is set from a large-text size, which is what the 3:1 palette floor assumes', () => {
    // --fs-2xl is 1.75rem = 28px; the floor needs >= 18.66px bold.
    expect(block).toContain('font-size: var(--fs-2xl)');
  });

  /**
   * Composed, never restated. `.figure` already owns 700, and a second `font-weight: 700` beside
   * it is a second place to be wrong — the weight half of this contract would then be asserted
   * against a declaration that no longer governs.
   */
  it('takes its weight by composing figure rather than restating it', () => {
    expect(block).toMatch(/composes:[^;]*figure/);
  });
});

describe('the shared figure class', () => {
  it('is what actually supplies the bold', () => {
    expect(read('../shared/styles/text.module.css')).toMatch(/\.figure \{[^}]*font-weight: 700/);
  });
});
