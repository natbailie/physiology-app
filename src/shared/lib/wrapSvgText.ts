/**
 * Greedy line-breaking for SVG `<text>`, which does not wrap on its own.
 *
 * Every diagram is hand-written SVG inside `DiagramFrame`, whose panel clips with
 * `overflow: hidden`. A caption wider than the viewBox is therefore not merely ugly — it is
 * invisible, silently, with no console warning and nothing in the DOM to suggest text is
 * missing. Several `patternSummary` sentences ran to 175 characters against a ~71-character
 * budget, so more than half of the explanation never reached the screen.
 *
 * Pure and DOM-free so it can be unit-tested the way the engines are.
 */

/** The separator these captions already use to join independent facts. */
const FACT_SEPARATOR = ' · ';

/**
 * Characters per line for a monospace run.
 *
 * Every diagram label is `var(--mono)` with letter-spacing, so advance width is
 * `fontSize * (0.6 + tracking)` — near enough exact for a monospace face, and deliberately
 * pessimistic rather than optimistic: a line estimated one character short wraps early, where
 * one estimated long gets clipped.
 */
export function monoCharsPerLine(maxWidth: number, fontSize: number, trackingEm = 0.06): number {
  const advance = fontSize * (0.6 + trackingEm);
  return Math.max(1, Math.floor(maxWidth / advance));
}

/**
 * Break `text` into lines of at most `maxChars`.
 *
 * Breaks at the fact separator first so a wrapped caption splits between facts rather than
 * mid-fact, then at spaces, and only hard-breaks a single word longer than the whole line.
 */
export function wrapSvgText(text: string, maxChars: number): string[] {
  const source = text.trim().replace(/\s+/g, ' ');
  if (maxChars < 1) return [source];
  if (source.length <= maxChars) return source.length > 0 ? [source] : [];

  // Facts are atomic where they fit; anything longer re-enters as words.
  const chunks = source.includes(FACT_SEPARATOR)
    ? source.split(FACT_SEPARATOR).flatMap((fact, index, all) => {
        const withSeparator = index < all.length - 1 ? `${fact} ·` : fact;
        return withSeparator.length <= maxChars ? [withSeparator] : withSeparator.split(' ');
      })
    : source.split(' ');

  const lines: string[] = [];
  let line = '';

  for (const chunk of chunks) {
    if (line === '') {
      line = chunk;
    } else if (`${line} ${chunk}`.length <= maxChars) {
      line = `${line} ${chunk}`;
    } else {
      lines.push(line);
      line = chunk;
    }

    // A single token wider than the line: split it rather than let it overhang.
    while (line.length > maxChars) {
      lines.push(line.slice(0, maxChars));
      line = line.slice(maxChars);
    }
  }

  if (line !== '') lines.push(line);
  return lines;
}
