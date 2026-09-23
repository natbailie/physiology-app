import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Every `var(--token)` a stylesheet reaches for is a token something actually defines.
 *
 * Nothing else in the suite reads a stylesheet. `palette.test.ts` checks the palette OBJECT, and
 * `tsc` and `vite build` never look inside a `var()`, so an invented custom property is invisible
 * to all three: the declaration is simply dropped at computed-value time and the browser moves on.
 *
 * That is not a cosmetic failure mode. Three invented tokens shipped in one feature — the worst of
 * them painted a selected filter chip in inherited near-black slate on the brand blue, at 3.45:1
 * against a 4.5:1 floor this project holds its text ramp to, and the other two made a badge the
 * same colour as the card behind it. Every one of them passed 2900 tests.
 *
 * So this is a RATCHET on the promise rather than on a count: a token referenced without a
 * fallback must exist, and a new one that does not fails here rather than rendering as nothing.
 *
 * A `var(--x, fallback)` is deliberately NOT checked. Stating a fallback is how a stylesheet says
 * "this may legitimately be absent" — `ModuleCard`'s accent and the diagram sheets rely on it —
 * and treating that as an error would punish the one construct that handles absence correctly.
 */

/**
 * Read from disk rather than through `import.meta.glob(..., '?raw')`.
 *
 * Vite's CSS-modules transform beats the `?raw` query for anything named `*.module.css`, so the
 * glob hands back each file's class MAP — an object — and only plain `.css` arrives as a string.
 * The oracle tests already read fixtures with `node:fs`, and that works for every sheet alike.
 */
const SRC = fileURLToPath(new URL('..', import.meta.url));

const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
  .map((name) => name.split('\\').join('/'))
  .filter((name) => /\.(css|tsx?)$/.test(name) && !name.endsWith('.d.ts'))
  .map((name) => [`src/${name}`, readFileSync(`${SRC}${name}`, 'utf8')] as const);

const sheets = files.filter(([path]) => path.endsWith('.css'));

/** `--token` in a `var(...)`, only where no comma follows the name — i.e. no fallback given. */
const REFERENCE = /var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g;

/** `--token:` at the start of a declaration, which is how a stylesheet defines one. */
const DEFINITION = /(^|[;{\s])(--[a-zA-Z0-9-]+)\s*:/g;

/**
 * `'--token':` inside an inline style object, which is the OTHER way this project defines one.
 *
 * Several diagrams hand a live value to their stylesheet through the element's own style —
 * `style={{ '--heat': ... }}` in thermoregulation, `--cell-color` and `--mass-color` in
 * anteriorPituitary, `--card-accent` on every module tile. Those tokens appear in no stylesheet
 * and are not bugs, and a check that reported them would be a check people learned to ignore.
 */
const INLINE_DEFINITION = /['"](--[a-zA-Z0-9-]+)['"]\s*:/g;

function matchesIn(source: string, pattern: RegExp, group: number): string[] {
  return [...source.matchAll(pattern)].map((match) => match[group] as string);
}

const defined = new Set<string>();
const referenced = new Map<string, Set<string>>();

for (const [, source] of files) {
  for (const token of matchesIn(source, INLINE_DEFINITION, 1)) defined.add(token);
}

for (const [path, css] of sheets) {
  for (const token of matchesIn(css, DEFINITION, 2)) defined.add(token);
  for (const token of matchesIn(css, REFERENCE, 1)) {
    const where = referenced.get(token) ?? new Set<string>();
    where.add(path);
    referenced.set(token, where);
  }
}

describe('CSS custom properties', () => {
  it('finds the stylesheets at all, so this cannot pass by discovering nothing', () => {
    expect(sheets.length).toBeGreaterThan(10);
    expect(defined.size).toBeGreaterThan(50);
  });

  it('defines every token a stylesheet uses without a fallback', () => {
    const undefinedTokens = [...referenced]
      .filter(([token]) => !defined.has(token))
      // Named with the file, because the token alone does not say where to go and looking it up
      // across forty stylesheets is the tedious half of the fix.
      .map(([token, where]) => `${token} — used in ${[...where].sort().join(', ')}`)
      .sort();

    expect(undefinedTokens).toEqual([]);
  });
});
