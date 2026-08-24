import { monoCharsPerLine, wrapSvgText } from '@/shared/lib/wrapSvgText';

interface DiagramTextProps {
  x: number;
  /** Baseline of the FIRST line. Subsequent lines step downward by `lineHeight`. */
  y: number;
  /** How much horizontal room this label has, in viewBox units. */
  maxWidth: number;
  /** Must match the `font-size` of `className` — the wrap is computed, not measured. */
  fontSize?: number;
  /** Must match the `letter-spacing` of `className`, in em. */
  tracking?: number;
  lineHeight?: number;
  className?: string;
  anchor?: 'start' | 'middle' | 'end';
  /**
   * Text only. An array is what JSX hands over for a body built from several expressions
   * (`foo {a} · bar {b}`), so it is accepted and joined rather than forced on every caller.
   * Elements are not: this measures characters, and it cannot measure a `<tspan>`.
   */
  children: DiagramTextChild | DiagramTextChild[];
}

type DiagramTextChild = string | number | false | null | undefined;

/** JSX drops `{cond && '…'}` in as `false`; those contribute no characters. */
function flatten(children: DiagramTextChild | DiagramTextChild[]): string {
  const parts = Array.isArray(children) ? children : [children];
  return parts.filter((part) => typeof part === 'string' || typeof part === 'number').join('');
}

/**
 * A diagram label that wraps instead of being clipped.
 *
 * `DiagramFrame` clips with `overflow: hidden` and SVG `<text>` has no wrapping of its own, so a
 * caption wider than its slot simply disappears past the edge — no warning, nothing missing from
 * the DOM. That is how several modules ended up showing half a sentence.
 *
 * The wrap is computed from the type metrics rather than measured, because `getBBox` is not
 * available during render and a layout pass per label would be paid on every engine tick. Every
 * diagram label is monospace, which makes the arithmetic exact; `fontSize` and `tracking` must
 * therefore agree with the class being passed in, and the defaults match the house scale
 * (`.label`/`.caption`: 11px, 0.06em).
 */
export function DiagramText({
  x,
  y,
  maxWidth,
  fontSize = 11,
  tracking = 0.06,
  lineHeight,
  className,
  anchor = 'start',
  children,
}: DiagramTextProps) {
  const lines = wrapSvgText(flatten(children), monoCharsPerLine(maxWidth, fontSize, tracking));
  if (lines.length === 0) return null;

  const step = lineHeight ?? Math.round(fontSize * 1.35);

  return (
    <text className={className} x={x} y={y} textAnchor={anchor}>
      {lines.map((line, index) => (
        <tspan key={`${index}-${line}`} x={x} dy={index === 0 ? 0 : step}>
          {line}
        </tspan>
      ))}
    </text>
  );
}
