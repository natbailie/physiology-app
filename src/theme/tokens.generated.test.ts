import { describe, expect, it } from 'vitest';
import indexCss from '../index.css?raw';
import { colourTokens, parseThemeBlocks, resolveColor } from './palette';
import { TOKENS } from './tokens.generated';

/**
 * The generated token palette has one job the web does not: standing in for CSS somewhere there
 * is none (tests, and the native app). That only works if the generated file is exactly what
 * `index.css` says right now, so this test re-parses the CSS with the same resolver the
 * generator uses and fails if the file has drifted. Same rule and same shape as
 * `src/modules/manifest.generated.test.ts`.
 */
describe('generated token palette', () => {
  it('is current with index.css', () => {
    const blocks = parseThemeBlocks(indexCss);
    const expected = {
      light: Object.fromEntries(colourTokens(blocks).map((t) => [t, resolveColor(t, 'light', blocks)])),
      dark: Object.fromEntries(colourTokens(blocks).map((t) => [t, resolveColor(t, 'dark', blocks)])),
    };
    expect(TOKENS).toEqual(expected);
  });
});