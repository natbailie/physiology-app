/**
 * Where a `labelRail`'s parts go. Pure geometry, no imports, so the phone, the web and the
 * diagram audit all lay a rail out identically — the drift between renderers only ever shows on
 * the platform without a cascade, and a rail that disagreed between them would be worse than the
 * hand-placed labels it replaces.
 *
 * Two layouts come out of one declaration:
 *
 *   WIDE   — a column of names down each margin, each on a leader ending in a dot on the thing it
 *            names. Items stack at a fixed line height in author order, and every leader starts at
 *            the column's inner edge, so a label cannot collide with another label or with a
 *            leader. Not "does not today": cannot.
 *   NARROW — numbered badges on the drawing, and the names in a key rendered OUTSIDE the svg. Text
 *            in these frames is sized in user units and scales with the drawing, so at the median
 *            viewBox width of 480 a phone renders an 11-unit label at about 8.6px. A numeral
 *            survives that; a word does not.
 */

/** Below this RENDERED width in CSS pixels, a rail becomes numbered badges plus a key. */
export const RAIL_NARROW_BELOW = 520;

export interface RailItemInput {
  text: string;
  target: [number, number];
  side?: 'left' | 'right';
  cls?: string;
}

export interface RailSpec {
  items: readonly RailItemInput[];
  gutter?: number;
  lineHeight?: number;
  top?: number;
}

export interface RailLabel {
  text: string;
  cls: string;
  /** Baseline position of the text. */
  x: number;
  y: number;
  anchor: 'start' | 'end';
  /** `d` for the leader, from the column's inner edge to the target. */
  leader: string;
  dot: [number, number];
}

export interface RailBadge {
  n: number;
  x: number;
  y: number;
}

export interface RailKeyEntry {
  n: number;
  text: string;
}

export interface RailLayout {
  labels: RailLabel[];
  badges: RailBadge[];
  key: RailKeyEntry[];
}

const GUTTER = 96;
const LINE_HEIGHT = 16;
const TOP = 20;
/** Keeps the last label in a column clear of the frame's bottom edge. */
const BOTTOM = 12;
/** Text sits this far inside the column's edge; the leader starts just outside it. */
const TEXT_INSET = 10;
const LEADER_INSET = 6;
/** Lifts the leader off the baseline to the vertical middle of the glyphs. */
const LEADER_RISE = 4;

export const RAIL_DOT_R = 1.6;
export const RAIL_BADGE_R = 9;

/**
 * Place one column: each label as near its target's height as the column allows.
 *
 * Stacking in author order from the top of the frame is what the first version did, and it is
 * wrong in a way that is obvious the moment you look at one — a name at the top of the right
 * column whose target is at the bottom of the drawing drags a leader diagonally across the whole
 * picture. Every reference plate keeps its leaders short and roughly horizontal by putting the
 * name beside the thing.
 *
 * So: sort by target height, seat each label at its target, then separate them. The forward pass
 * pushes overlapping labels down, and if that runs the column past the bottom the backward pass
 * lifts the tail back up. Both passes preserve order, so leaders in a column never cross.
 */
function placeColumn(
  items: { item: RailItemInput; index: number }[],
  top: number,
  bottom: number,
  lineHeight: number,
): { item: RailItemInput; index: number; y: number }[] {
  const seated = items
    .map((entry) => ({ ...entry, y: Math.min(Math.max(entry.item.target[1], top), bottom) }))
    .sort((a, b) => a.y - b.y);

  for (let i = 1; i < seated.length; i++) {
    seated[i]!.y = Math.max(seated[i]!.y, seated[i - 1]!.y + lineHeight);
  }
  // The column may now overflow the frame; walk back up from the last one.
  for (let i = seated.length - 1; i >= 0; i--) {
    const limit = i === seated.length - 1 ? bottom : seated[i + 1]!.y - lineHeight;
    seated[i]!.y = Math.min(seated[i]!.y, limit);
  }
  return seated;
}

export function layoutRail(spec: RailSpec, viewBox: readonly [number, number, number, number]): RailLayout {
  const [vx, vy, vw, vh] = viewBox;
  const gutter = spec.gutter ?? GUTTER;
  const lineHeight = spec.lineHeight ?? LINE_HEIGHT;
  const top = vy + (spec.top ?? TOP);
  const bottom = vy + vh - BOTTOM;
  const midX = vx + vw / 2;

  const leftEdge = vx + gutter;
  const rightEdge = vx + vw - gutter;

  const left: { item: RailItemInput; index: number }[] = [];
  const right: { item: RailItemInput; index: number }[] = [];
  spec.items.forEach((item, index) => {
    const onLeft = item.side ? item.side === 'left' : item.target[0] < midX;
    (onLeft ? left : right).push({ item, index });
  });

  const labels: RailLabel[] = [];
  const badges: RailBadge[] = [];
  const key: RailKeyEntry[] = [];

  // Numbered down the left column and then down the right, which is the order a reader scans
  // them in — so the key under the drawing reads in the same order as the badges on it.
  let n = 0;
  for (const [column, onLeft] of [
    [left, true],
    [right, false],
  ] as const) {
    for (const seat of placeColumn(column, top, bottom, lineHeight)) {
      const { item, y } = seat;
      const textX = onLeft ? leftEdge - TEXT_INSET : rightEdge + TEXT_INSET;
      const leaderX = onLeft ? leftEdge - LEADER_INSET : rightEdge + LEADER_INSET;
      n += 1;

      labels.push({
        text: item.text,
        cls: item.cls ?? 'anatomy',
        x: textX,
        y,
        // Right-aligned against the left column's inner edge and left-aligned against the right
        // one's, so every leader in a column starts at the same x whatever the name's length.
        anchor: onLeft ? 'end' : 'start',
        leader: `M${leaderX},${y - LEADER_RISE} L${item.target[0]},${item.target[1]}`,
        dot: item.target,
      });
      badges.push({ n, x: item.target[0], y: item.target[1] });
      key.push({ n, text: item.text });
    }
  }

  return { labels, badges, key };
}

/**
 * The viewBox to draw with when a rail has collapsed to badges and a key.
 *
 * A railed frame reserves a gutter each side for its names. On a narrow frame those names are
 * not there — they are in the key under the drawing — so the gutters render as empty space, and
 * on cardiorenal that cost 29% of the width of the one screen where width is scarcest.
 *
 * Cropping the viewBox to the content is the whole fix, and it is better than the obvious
 * alternative of scaling the content up: a uniform scale that fills the width also grows the
 * height, so the drawing overflows top and bottom, and it thickens every stroke on the way. A
 * viewBox crop changes the framing and nothing else.
 *
 * Frames with no rail, and frames whose gutters would leave nothing, are returned untouched.
 */
/** Which margins a rail actually puts labels in. A frame widened on one side only must not be
 *  cropped on both — that removes drawing, not empty margin. */
function railSides(spec: RailSpec, midX: number): { left: boolean; right: boolean } {
  let left = false;
  let right = false;
  for (const item of spec.items) {
    if (item.side ? item.side === 'left' : item.target[0] < midX) left = true;
    else right = true;
  }
  return { left, right };
}

export function contentViewBox(
  rails: readonly RailSpec[],
  viewBox: readonly [number, number, number, number],
): [number, number, number, number] {
  const [vx, vy, vw, vh] = viewBox;
  if (rails.length === 0) return [vx, vy, vw, vh];
  const gutter = Math.min(...rails.map((r) => r.gutter ?? GUTTER));
  if (!Number.isFinite(gutter) || gutter <= 0) return [vx, vy, vw, vh];

  /* Crop only the margins that hold names. neuromuscularJunction widened on the LEFT alone —
   * every one of its names is in that column — and cropping symmetrically took 124 units off
   * the right, which is where its EPP bar lives. The sweep caught it as a 77px clip. */
  const midX = vx + vw / 2;
  const used = rails.map((r) => railSides(r, midX));
  const cropLeft = used.some((u) => u.left) ? gutter : 0;
  const cropRight = used.some((u) => u.right) ? gutter : 0;
  const width = vw - cropLeft - cropRight;
  if (width < vw * 0.3) return [vx, vy, vw, vh];
  return [vx + cropLeft, vy, width, vh];
}
