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

  /**
   * 3:1 is the WCAG 1.4.11 floor for a boundary — which is what --panel-border is. It rims
   * every button, chip, range track, radio and readout tile, so a border nobody can see is a
   * control nobody can find. This assertion is the one that would have caught the shipped
   * failure: `#dfe6ef` on white measured 1.26:1, `#1d3352` on `--panel` 1.43:1.
   *
   * Deliberately NOT extended to --grid-line: axis gridlines inside the four plot modules
   * measure 1.09–1.26:1 and are plot furniture, not boundaries — the trace and its labels
   * carry the meaning (traces are asserted as strokes above). Holding furniture to the
   * boundary floor would paint gridlines as heavy as the controls they sit behind.
   */
  it('keeps the neutral border visible against both surfaces it separates', () => {
    for (const surface of [panel, bg]) {
      const colour = theme['--panel-border']!;
      expect(contrast(colour, surface), `--panel-border in ${themeName}`).toBeGreaterThanOrEqual(3);
    }
  });

  /**
   * At the SMALL-text floor, not the large one it used to hold.
   *
   * `--on-solid` now carries an 11pt label: the phone's bed picker fills the selected bed with
   * the module accent and prints the acuity word on it. A signal colour cannot go there — every
   * acuity on every bedded module's accent measures between 1.00 and 1.60:1, and
   * gastrointestinal's accent IS `--danger`, so CRASH on it was the word in its own background
   * colour. `--on-solid` is the whole answer to that, which makes it load-bearing at a size
   * 3:1 does not honestly cover.
   *
   * The margin is real but thin — `--lymph` is the worst at 4.53:1 — so a palette edit that
   * trips this has made a chip unreadable rather than merely shifted a hue.
   */
  it('keeps text on a solid signal legible at small sizes, which is what --on-solid is for', () => {
    const onSolid = theme['--on-solid']!;
    const ranked = SIGNALS.map((name) => ({ name, ratio: contrast(onSolid, theme[`--${name}`]!) })).sort(
      (a, b) => a.ratio - b.ratio,
    );
    const worst = ranked[0]!;
    expect(worst.ratio, `--on-solid on --${worst.name} in ${themeName}`).toBeGreaterThanOrEqual(4.5);
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

  /**
   * The instrument ground, for the same reason and with the same history.
   *
   * A bedside vitals tile is deliberately the same near-black in both themes — a monitor does
   * not invert — which means these four are the one pair in the palette that cannot be checked
   * by looking at the theme around them. Both themes are asserted anyway: identical values
   * today is a fact about the palette, not a guarantee, and the day one of them is retuned for
   * dark this is what says whether the caption survived it.
   */
  it('keeps the instrument readouts legible on their own ink', () => {
    const ink = theme['--readout-ink']!;
    for (const token of ['--on-readout-ink', '--readout-ink-dim']) {
      const colour = theme[token]!;
      expect(contrast(colour, ink), `${token} on --readout-ink in ${themeName}`).toBeGreaterThanOrEqual(4.5);
    }
    // A vitals tile prints its number in the signal colour of the quantity it carries, so the
    // signals have to clear a floor on this ground too — but 3:1, not 4.5:1, and the reason is
    // a fact about the component rather than a concession. WCAG's large-text floor is 3:1 at
    // 18.66px bold or above, and a vitals numeral is bold mono at --fs-2xl (28px):
    // readoutInkLargeText.style.test.ts holds every surface that prints one to that size, because
    // the moment a number here is printed small this assertion stops being the right one.
    //
    // The light signals are calibrated on WHITE with very little headroom, so on the raised
    // slab twenty of them sit between 4.05 and 4.49. Holding them to 4.5 here would not make
    // the tile more readable; it would force the slab back to white and delete the surface.
    const failures = SIGNALS.map((name) => ({ name, ratio: contrast(theme[`--${name}`]!, ink) }))
      .filter(({ ratio }) => ratio < 3)
      .map(({ name, ratio }) => `${name} ${ratio.toFixed(2)}:1`);
    expect(failures.join(', '), `below 3:1 on --readout-ink in ${themeName}: ${failures.join(', ')}`).toBe('');
  });
});