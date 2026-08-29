import { describe, expect, it } from 'vitest';
import indexCss from '../index.css?raw';
import { contrast, mixOklab, parseHex, type Rgb } from '@/shared/lib/color';

/**
 * The light palette was hand-calibrated on white paper. The dark one is not hand-written at
 * all: `index.css` lifts all 93 signal colours towards `--signal-tint` by `--signal-lift` in
 * a single `color-mix(in oklab, ...)`. That is only defensible if something checks the result,
 * so this file recomputes the mix and measures it.
 *
 * "Constants are calibrated, not invented" (CLAUDE.md). Change `--signal-lift` and these
 * assertions should be what tells you whether the change was an improvement.
 */

/**
 * Declarations from EVERY rule with this selector. The bases and the colours derived from
 * them live in two separate `:root` blocks, so reading only the first sees half the palette.
 */
function block(selector: string): Map<string, string> {
  const out = new Map<string, string>();
  let at = indexCss.indexOf(selector);
  if (at < 0) throw new Error(`no ${selector} block in index.css`);
  while (at >= 0) {
    const open = indexCss.indexOf('{', at);
    const close = indexCss.indexOf('\n}', open);
    for (const line of indexCss.slice(open + 1, close).split('\n')) {
      const m = /^\s*(--[a-z0-9-]+):\s*([^;]+);/.exec(line);
      if (m) out.set(m[1]!, m[2]!.trim());
    }
    at = indexCss.indexOf(selector, close);
  }
  return out;
}

const light = block(':root {');
const dark = block(":root[data-theme='dark'] {");

// A hex value, not just the suffix: --fs-base is a font size, not a colour.
const BASES = [...light.keys()].filter((k) => k.endsWith('-base') && light.get(k)!.startsWith('#'));
// Bare names — 'artery', not '--artery-base'.
const SIGNALS = BASES.map((k) => k.replace(/^--/, '').replace(/-base$/, ''));

/** What the browser computes for `--<name>` under a theme. */
function signal(name: string, theme: Map<string, string>): Rgb {
  const base = parseHex(light.get(`--${name}-base`)!);
  const tint = parseHex(theme.get('--signal-tint') ?? light.get('--signal-tint')!);
  const liftRaw = theme.get('--signal-lift') ?? light.get('--signal-lift')!;
  const lift = Number(liftRaw.replace('%', '')) / 100;
  const override = theme.get(`--${name}`);
  if (override?.startsWith('#')) return parseHex(override);
  return mixOklab(base, tint, lift);
}

const surfaces = (theme: Map<string, string>) => ({
  panel: parseHex(theme.get('--panel') ?? light.get('--panel')!),
  bg: parseHex(theme.get('--bg') ?? light.get('--bg')!),
});

describe('signal palette', () => {
  it('has the ~93 signal colours the diagrams draw with', () => {
    expect(SIGNALS.length).toBeGreaterThan(90);
  });

  it('derives every base, so adding a base without a derived line is caught here', () => {
    const missing = SIGNALS.filter((name) => !light.has(`--${name}`));
    expect(missing.join(', '), `bases with no derived declaration: ${missing.join(', ')}`).toBe('');
  });

  it('derives nothing that has no base', () => {
    const derived = [...light.keys()].filter((k) => light.get(k)!.startsWith('color-mix'));
    const orphans = derived.filter((k) => !light.has(`${k}-base`));
    expect(orphans.join(', ')).toBe('');
  });

  it('leaves the light palette exactly as it was calibrated', () => {
    // --signal-lift is 0% in light, so the mix must be the identity. If this fails, the light
    // palette has been changed by a dark-mode edit, which is the one thing it must survive.
    for (const name of SIGNALS) {
      const base = parseHex(light.get(`--${name}-base`)!);
      const got = signal(name, light);
      expect(contrast(base, got), `${name} shifted in light`).toBeLessThan(1.02);
    }
  });
});

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme', (themeName, theme) => {
  const { panel, bg } = surfaces(theme);

  /**
   * 4.5:1 is the WCAG AA floor for body text. Every one of these colours is used as a label
   * somewhere — a readout tile heading, an axis caption, an organ name in a diagram.
   */
  it('keeps every signal readable as label text on the panel', () => {
    const failures = SIGNALS.map((name) => ({ name, ratio: contrast(signal(name, theme), panel) }))
      .filter(({ ratio }) => ratio < 4.5)
      .map(({ name, ratio }) => `${name} ${ratio.toFixed(2)}:1`);
    expect(failures.join(', '), `below 4.5:1 on --panel in ${themeName}: ${failures.join(', ')}`).toBe('');
  });

  /**
   * 3:1, not 4.5:1. The contract these colours were calibrated against is the PANEL — signal
   * colours label readouts and diagrams, both of which sit on --panel. On the page ground they
   * appear as strokes and washes, so the graphical floor is the honest bar. Asserting 4.5:1
   * here would fail 23 colours that were never intended to carry text on that surface.
   */
  it('keeps every signal visible against the page ground', () => {
    const failures = SIGNALS.map((name) => ({ name, ratio: contrast(signal(name, theme), bg) }))
      .filter(({ ratio }) => ratio < 3)
      .map(({ name, ratio }) => `${name} ${ratio.toFixed(2)}:1`);
    expect(failures.join(', '), `below 3:1 on --bg in ${themeName}: ${failures.join(', ')}`).toBe('');
  });

  /** 3:1 is the floor for a graphical object — which is what a 2px trace or vessel stroke is. */
  it('keeps every signal visible as a stroke', () => {
    const failures = SIGNALS.map((name) => ({ name, ratio: contrast(signal(name, theme), panel) }))
      .filter(({ ratio }) => ratio < 3)
      .map(({ name }) => name);
    expect(failures.join(', ')).toBe('');
  });

  it('keeps the text ramp itself legible', () => {
    for (const token of ['--text', '--text-dim', '--text-faint']) {
      const colour = parseHex(theme.get(token) ?? light.get(token)!);
      expect(contrast(colour, panel), `${token} on --panel in ${themeName}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps text on a solid signal legible, which is what --on-solid is for', () => {
    const onSolid = parseHex(theme.get('--on-solid') ?? light.get('--on-solid')!);
    const worst = SIGNALS.map((name) => contrast(onSolid, signal(name, theme))).sort((a, b) => a - b)[0]!;
    expect(worst).toBeGreaterThanOrEqual(3);
  });
});
