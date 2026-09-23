import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Node environment, deliberately: under jsdom `import.meta.url` is an http URL and
// `fileURLToPath` refuses it — see readoutInkLargeText.style.test.ts.

/**
 * WCAG 2.2 2.4.11 Focus Not Obscured, held where it is set.
 *
 * The module top bar is sticky and has no fixed height (the preset row wraps), so a
 * control tabbed to near the top of the viewport would scroll underneath it. The fix is
 * `scroll-margin-top` on every focusable descendant, measured from the same `--topbar-h`
 * the ResizeObserver publishes — so if this declaration drifts from that variable, or a
 * rewrite drops the rule, this fails rather than silently re-hiding focused controls.
 */
const source = readFileSync(fileURLToPath(new URL('./ModulePage.module.css', import.meta.url)), 'utf8');

describe('2.4.11 focus clearance', () => {
  it('declares a scroll margin from the measured top-bar height, not a guessed pixel value', () => {
    expect(source).toMatch(/scroll-margin-top:\s*calc\(var\(--topbar-h\)/);
  });

  it('covers every kind of focusable descendant, so no control is left to hide', () => {
    const block = source.match(/\.page[^{]*\{[^}]*scroll-margin-top:[^}]*\}/)?.[0] ?? '';
    expect(block, 'scroll-margin rule exists').not.toBe('');
    for (const selector of ['a', 'button', 'input', 'select', 'textarea', '[tabindex]']) {
      expect(block, `selector covers ${selector}`).toContain(selector);
    }
  });
});
