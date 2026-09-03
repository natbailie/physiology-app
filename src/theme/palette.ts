/**
 * Resolving the CSS token palette to plain hex without a browser.
 *
 * `src/index.css` is the source of truth: the light `:root` blocks hand-calibrate every colour
 * and the dark block lifts the signal palette in one `color-mix(in oklab, ...)` — the dark theme
 * is not hand-written, and 102 colours survive on a dark surface without 102 second opinions.
 * A browser resolves custom properties at render time; a React Native app has no CSS at all, and
 * a test has no browser. This module reproduces exactly the one resolution the browser does —
 * a literal hex, a `var()` indirection, or the single oklab mix — so the token generator and the
 * palette tests see what the browser would compute.
 *
 * `tools/generate-tokens/generate.ts` turns this into `src/theme/tokens.generated.ts` (shared with
 * the native app), and `tokens.generated.test.ts` re-parses `index.css` and fails if that file
 * has drifted. The `.ts` extension on the `color.ts` import is deliberate: Node runs this file
 * directly (type stripping) when the generator loads it, and type stripping needs explicit
 * extensions in relative imports.
 */

import { mixOklab, parseHex, toHex } from '../shared/lib/color.ts';

export interface ThemeBlocks {
  light: ReadonlyMap<string, string>;
  dark: ReadonlyMap<string, string>;
}

/** Declarations from every rule with this selector — the bases and the derived colours live in
 * two separate light `:root` blocks, so reading only the first would see half the palette. */
function block(css: string, selector: string): Map<string, string> {
  const out = new Map<string, string>();
  let at = css.indexOf(selector);
  if (at < 0) throw new Error(`no ${selector} block in index.css`);
  while (at >= 0) {
    const open = css.indexOf('{', at);
    const close = css.indexOf('\n}', open);
    for (const line of css.slice(open + 1, close).split('\n')) {
      const m = /^\s*(--[a-z0-9-]+):\s*([^;]+);/.exec(line);
      if (m) out.set(m[1]!, m[2]!.trim());
    }
    at = css.indexOf(selector, close);
  }
  return out;
}

export function parseThemeBlocks(css: string): ThemeBlocks {
  return {
    light: block(css, ':root {'),
    dark: block(css, ":root[data-theme='dark'] {"),
  };
}

/** The token a theme should resolve, for a dark theme falling back to the light declaration. */
function pick(token: string, theme: 'light' | 'dark', blocks: ThemeBlocks): string | undefined {
  return (theme === 'dark' ? blocks.dark.get(token) : undefined) ?? blocks.light.get(token);
}

/** What a browser computes for `--<token>` under a theme, as `#rrggbb`. */
export function resolveColor(token: string, theme: 'light' | 'dark', blocks: ThemeBlocks): string {
  const value = pick(token, theme, blocks);
  if (value === undefined) throw new Error(`no value for --${token} in ${theme}`);
  return resolveValue(value, theme, blocks, new Set([token]));
}

function reference(name: string, theme: 'light' | 'dark', blocks: ThemeBlocks, seen: Set<string>): string {
  if (seen.has(name)) throw new Error(`token cycle: ${[...seen, name].join(' -> ')}`);
  const value = pick(name, theme, blocks);
  if (value === undefined) throw new Error(`--${name} referenced but never declared`);
  return resolveValue(value, theme, blocks, new Set([...seen, name]));
}

function resolveValue(value: string, theme: 'light' | 'dark', blocks: ThemeBlocks, seen: Set<string>): string {
  const v = value.trim();
  if (v.startsWith('#')) return toHex(parseHex(v));

  const varRef = /^var\(--([a-z0-9-]+)\)$/.exec(v);
  if (varRef) return reference(`--${varRef[1]}`, theme, blocks, seen);

  // The one non-trivial shape index.css uses: the dark lift.
  //   color-mix(in oklab, var(--artery-base), var(--signal-tint) var(--signal-lift))
  const mix = /^color-mix\(in oklab, var\(--([a-z0-9-]+)\), var\(--([a-z0-9-]+)\) var\(--([a-z0-9-]+)\)\)$/.exec(v);
  if (mix) {
    const tint = pick(`--${mix[2]}`, theme, blocks);
    const liftRaw = pick(`--${mix[3]}`, theme, blocks);
    if (tint === undefined || liftRaw === undefined) {
      throw new Error(`mix for a colour token references an undeclared knob`);
    }
    if (!/^\d+%$/.test(liftRaw)) throw new Error(`unexpected --signal-lift value: ${liftRaw}`);
    const base = reference(`--${mix[1]}`, theme, blocks, seen);
    return toHex(mixOklab(parseHex(base), parseHex(tint), Number(liftRaw.replace('%', '')) / 100));
  }

  throw new Error(`value for a colour token is not a colour: ${v}`);
}

/** Every token that resolves to a solid colour, sorted, in light-theme order. */
export function colourTokens(blocks: ThemeBlocks): readonly string[] {
  const out: string[] = [];
  for (const token of blocks.light.keys()) {
    try {
      resolveColor(token, 'light', blocks);
      out.push(token);
    } catch {
      // Non-colour token — spacing, a shadow, a wash percentage. Deliberately absent.
    }
  }
  return out.sort();
}