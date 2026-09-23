import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TOKENS } from './tokens.generated';

/**
 * The browser-chrome colour, stated in three places, is the page ground in both themes.
 *
 * `<meta name="theme-color">` paints the address bar on mobile and the title bar on a desktop
 * PWA. It has to be right before first paint, which is why index.html sets it from an inline
 * script that cannot import anything, and why useTheme.ts restates the same two literals for
 * the case where the learner changes the preference later.
 *
 * Three copies of a colour with nothing holding them together is how they came to disagree:
 * before the navy palette landed, all three still read the slate ground from two designs ago,
 * so the address bar sat a visible step off the page it framed. Nothing failed, because no test
 * had ever looked. This is that test.
 */

const root = fileURLToPath(new URL('../..', import.meta.url));
const html = readFileSync(`${root}index.html`, 'utf8');
const useTheme = readFileSync(`${root}src/theme/useTheme.ts`, 'utf8');

/** Every 6-digit hex in a chunk of source, lowercased. */
const hexes = (source: string): string[] =>
  (source.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((hex) => hex.toLowerCase());

describe('theme-color', () => {
  const light = TOKENS.light['--bg']!.toLowerCase();
  const dark = TOKENS.dark['--bg']!.toLowerCase();

  it('matches --bg in the static meta tag, which is the DARK default before the script runs', () => {
    // The static value is what a browser paints its chrome with for the instant before the
    // pre-paint script resolves a stored preference. It has to be the default, and the default
    // is dark — stating light here put a white bar above a near-black page on every cold load.
    const tag = html.match(/<meta name="theme-color" content="([^"]+)"/);
    expect(tag?.[1]?.toLowerCase()).toBe(dark);
  });

  it('matches --bg in the pre-paint script, for both themes', () => {
    const line = html.match(/setAttribute\('content',[^)]*\)/)?.[0] ?? '';
    expect(line, 'pre-paint script sets theme-color from two literals').not.toBe('');
    expect(hexes(line).sort()).toEqual([light, dark].sort());
  });

  it('matches --bg in useTheme, which owns the colour after a preference change', () => {
    const line = useTheme.match(/const THEME_COLOR[^;]+;/)?.[0] ?? '';
    expect(line, 'useTheme declares THEME_COLOR').not.toBe('');
    expect(hexes(line).sort()).toEqual([light, dark].sort());
  });
});
