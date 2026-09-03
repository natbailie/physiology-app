import { describe, expect, it } from 'vitest';
import { contrast, parseHex, type Rgb } from '@/shared/lib/color';
import { TOKENS } from './tokens.generated';

/**
 * The light palette was hand-calibrated on white paper. The dark one is not hand-written at
 * all: `index.css` lifts all signal colours towards `--signal-tint` by `--signal-lift` in a
 * single `color-mix(in oklab, ...)`. That is only defensible if something checks the result, so
 * this file recomputes the mix and measures it.
 *
 * The assertions read the GENERATED token palette, not the CSS directly — that is deliberate.
 * `index.css` stays the only source of truth (`tokens.generated.test.ts` re-parses it and fails
 * if the generated file drifts), and the native app imports the exact same generated file, so a
 * green run here calibrates contrast for both platforms at once.
 *
 * "Constants are calibrated, not invented" (CLAUDE.md). Change `--signal-lift` and these
 * assertions should be what tells you whether the change was an improvement.
 */

const toRgb = (theme: Readonly<Record<string, string>>): Record<string, Rgb> =>
  Object.fromEntries(Object.entries(theme).map(([token, hex]) => [token, parseHex(hex)]));

const LIGHT = toRgb(TOKENS.light);
const DARK = toRgb(TOKENS.dark);

// Bare names — 'artery', not '--artery-base'.
const SIGNALS = Object.keys(LIGHT)
  .filter((k) => k.endsWith('-base'))
  .map((k) => k.replace(/^--/, '').replace(/-base$/, ''));

describe('signal palette', () => {
  it('has the ~93 signal colours the diagrams draw with', () => {
    expect(SIGNALS.length).toBeGreaterThan(90);
  });

  it('derives every base, so adding a base without a derived line is caught here', () => {
    const missing = SIGNALS.filter((name) => LIGHT[`--${name}`] === undefined);
    expect(missing.join(', '), `bases with no derived declaration: ${missing.join(', ')}`).toBe('');
  });

  it('leaves the light palette exactly as it was calibrated', () => {
    // --signal-lift is 0% in light, so the mix must be the identity. If this fails, the light
    // palette has been changed by a dark-mode edit, which is the one thing it must survive.
    for (const name of SIGNALS) {
      const got = LIGHT[`--${name}`]!;
      const base = LIGHT[`--${name}-base`]!;
      expect(contrast(base, got), `${name} shifted in light`).toBeLessThan(1.02);
    }
  });
});

describe.each([
  ['light', LIGHT],
  ['dark', DARK],
] as const)('%s theme', (themeName, theme) => {
  const panel = theme['--panel']!;
  const bg = theme['--bg']!;

  /**
   * 4.5:1 is the WCAG AA floor for body text. Every one of these colours is used as a label
   * somewhere — a readout tile heading, an axis caption, an organ name in a diagram.
   */
  it('keeps every signal readable as label text on the panel', () => {
    const failures = SIGNALS.map((name) => ({ name, ratio: contrast(theme[`--${name}`]!, panel) }))
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
    const failures = SIGNALS.map((name) => ({ name, ratio: contrast(theme[`--${name}`]!, bg) }))
      .filter(({ ratio }) => ratio < 3)
      .map(({ name, ratio }) => `${name} ${ratio.toFixed(2)}:1`);
    expect(failures.join(', '), `below 3:1 on --bg in ${themeName}: ${failures.join(', ')}`).toBe('');
  });

  /** 3:1 is the floor for a graphical object — which is what a 2px trace or vessel stroke is. */
  it('keeps every signal visible as a stroke', () => {
    const failures = SIGNALS.filter((name) => contrast(theme[`--${name}`]!, panel) < 3);
    expect(failures.join(', ')).toBe('');
  });

  it('keeps the text ramp itself legible', () => {
    for (const token of ['--text', '--text-dim', '--text-faint']) {
      const colour = theme[token]!;
      expect(contrast(colour, panel), `${token} on --panel in ${themeName}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps text on a solid signal legible, which is what --on-solid is for', () => {
    const onSolid = theme['--on-solid']!;
    const worst = SIGNALS.map((name) => contrast(onSolid, theme[`--${name}`]!)).sort((a, b) => a - b)[0]!;
    expect(worst).toBeGreaterThanOrEqual(3);
  });

  /**
   * The brand chrome is the one surface pair NOT derived from a signal base: a near-black
   * slate panel used on the light page, carrying white type and a muted caption. Nothing
   * else measures it, and it is exactly the combination a palette edit would break quietly.
   */
  it('keeps the brand chrome legible on its own ink', () => {
    const ink = theme['--brand-ink']!;
    for (const token of ['--on-brand-ink', '--brand-ink-dim']) {
      const colour = theme[token]!;
      expect(contrast(colour, ink), `${token} on --brand-ink in ${themeName}`).toBeGreaterThanOrEqual(4.5);
    }
    // --brand itself is NOT the token to use here: calibrated on white, it lands at 3.45:1
    // on the ink. --brand-on-ink is the step that exists because this assertion caught that.
    const onInk = theme['--brand-on-ink']!;
    expect(contrast(onInk, ink), `--brand-on-ink on --brand-ink in ${themeName}`).toBeGreaterThanOrEqual(4.5);
  });
});