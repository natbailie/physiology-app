import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Node environment, deliberately: under jsdom `import.meta.url` is an http URL and
// `fileURLToPath` refuses it — see readoutInkLargeText.style.test.ts.

/**
 * Forced colours (Windows High Contrast), bound where it is set.
 *
 * The OS replaces the whole palette with system colours, so every custom wash, glow and
 * gradient goes with it. Each rule below repairs one thing the mapping genuinely breaks;
 * if a rewrite drops one, this fails rather than silently handing a high-contrast learner
 * a smeared numeral, an invisible slider fill, or a meter whose track and fill merge.
 */
const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const hasForcedBlock = (source: string, inner: RegExp): boolean => {
  const blocks = [...source.matchAll(/@media\s*\(forced-colors:\s*active\)\s*\{/g)];
  return blocks.some((match) => {
    // Bracket-match from the end of the @media opener to its closing brace.
    let depth = 0;
    const rest = source.slice(match.index);
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '{') depth++;
      else if (rest[i] === '}') {
        depth--;
        if (depth === 0) return inner.test(rest.slice(0, i + 1));
      }
    }
    return false;
  });
};

describe('forced-colours handling', () => {
  it('gives keyboard focus a system-guaranteed outline', () => {
    expect(hasForcedBlock(read('../index.css'), /outline:[^;]*Highlight/)).toBe(true);
  });

  it.each([
    ['../shared/components/ReadoutItem/ReadoutItem.module.css', '.value'],
    ['../shared/components/ClinicPanel/ClinicPanel.module.css', '.rowValue'],
    ['../shared/components/QuestionSet/QuestionSet.module.css', '.rowValue'],
  ])('drops the phosphor halo on %s, which the OS would paint in a replaced colour', (css, rule) => {
    expect(hasForcedBlock(read(css), new RegExp(`${rule.replace('.', '\\.')}[^}]*text-shadow:\\s*none`))).toBe(true);
  });

  it('keeps the slider track and thumb visible in system colours', () => {
    const source = read('../shared/components/Slider/Slider.module.css');
    expect(hasForcedBlock(source, /runnable-track[^}]*background:\s*Canvas/)).toBe(true);
    expect(hasForcedBlock(source, /thumb[^}]*background:\s*ButtonText/)).toBe(true);
  });

  it('keeps the mastery meter readable in system colours', () => {
    const source = read('../home/StudyReport.module.css');
    expect(hasForcedBlock(source, /\.meterFill[^}]*background:\s*Highlight/)).toBe(true);
  });
});
