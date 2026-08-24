import { describe, expect, it } from 'vitest';
import { monoCharsPerLine, wrapSvgText } from './wrapSvgText';

describe('monoCharsPerLine', () => {
  it('matches the house type scale: 11px mono with 0.06em tracking in a 516-unit slot', () => {
    // 11 * 0.66 = 7.26 units per character; 516 / 7.26 = 71.
    expect(monoCharsPerLine(516, 11)).toBe(71);
  });

  it('never returns zero, however narrow the slot', () => {
    expect(monoCharsPerLine(2, 15)).toBe(1);
  });
});

describe('wrapSvgText', () => {
  it('leaves a line that already fits alone', () => {
    expect(wrapSvgText('no nystagmus at rest', 40)).toEqual(['no nystagmus at rest']);
  });

  it('breaks between facts rather than mid-fact, keeping the separator on the line above', () => {
    const lines = wrapSvgText('free Hb 245 · complement consumed 78% · haemoglobinuria 65%', 30);
    expect(lines).toEqual(['free Hb 245 ·', 'complement consumed 78% ·', 'haemoglobinuria 65%']);
  });

  it('keeps every line within budget for the longest summary in the app', () => {
    const summary =
      'one nerve silent below resting rate: nystagmus beats toward the INTACT ear while the brain reads the mismatch as acceleration — vertigo 68%';
    const lines = wrapSvgText(summary, 71);
    expect(lines.length).toBeGreaterThan(1);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(71);
  });

  it('loses no words', () => {
    const summary = 'vertigo gone but VOR gain 0.42 — compensation hides the lesion';
    expect(wrapSvgText(summary, 20).join(' ')).toBe(summary);
  });

  it('hard-breaks a single token longer than the line rather than overhanging', () => {
    expect(wrapSvgText('supercalifragilistic', 8)).toEqual(['supercal', 'ifragili', 'stic']);
  });

  it('collapses whitespace so JSX indentation does not become a wrap point', () => {
    expect(wrapSvgText('  spaced   out\n  text  ', 40)).toEqual(['spaced out text']);
  });

  it('returns nothing for an empty string', () => {
    expect(wrapSvgText('   ', 40)).toEqual([]);
  });
});
