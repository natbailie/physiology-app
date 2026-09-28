import type { DefNode, GroupNode, PathNode, SceneNode } from '@/shared/presentation/types';
import type { OrganPlacement } from './organShapes';

/* ==================================================================== */
/*  Tissue                                                              */
/*                                                                      */
/*  `organShapes.ts` draws organs. This file draws what an organ is made */
/*  of, at the scale of a few cells — and so, by the house rule, it is   */
/*  SCHEMATIC. A villus here is a rounded finger with a band of          */
/*  epithelium, a capillary loop and a lacteal, not a histology plate:   */
/*  drawing cells as gross anatomy would lie about the scale in the      */
/*  other direction.                                                     */
/*                                                                      */
/*  The same three rules hold as for the organs: a builder returns scene */
/*  nodes, takes its colour from the caller, and hands back its defs.    */
/* ==================================================================== */

export interface TissueDrawing {
  node: GroupNode;
  defs: readonly DefNode[];
}

/* --- Villi ---------------------------------------------------------- */
/*
 * Three villi standing on a mucosa with crypts between them, the first one cut away to show its
 * core — the first, so the names in the left margin reach it without crossing another villus: an arteriole up one side, a venule down the other (the portal route, for everything
 * water-soluble), and a blind-ended lacteal up the middle (the lymphatic route, for fat). The
 * epithelium is a band of enterocytes with a brush border on the lumenal face and a goblet cell
 * among them.
 *
 * The `flat` variant is colonic mucosa: no villi, straight deep crypts, many goblet cells. It is
 * what the surface looks like where short-chain fatty acids are absorbed, and it is what a small
 * bowel with total villous atrophy starts to resemble.
 *
 * Natural size: 250 wide by 200 tall, origin at the TOP-LEFT (not centred), lumen at the top.
 */

const VILLUS_BASE = 150;
const VILLUS_HALF = 22;
const EPITHELIUM = 7;
const VILLUS_CENTRES = [45, 125, 205] as const;
const MUSCULARIS = 196;

export interface VillusRoute {
  token: string;
  /** Where the absorbed product leaves the cell: the portal capillary, the lacteal, or used by the
   * colonocyte itself (then onward to the capillary). */
  via: 'capillary' | 'lacteal' | 'colonocyte';
}

export interface VillusParams {
  /** 0-1: villus height as a fraction of normal. Villous atrophy flattens them. */
  villusHeight?: number;
  /** 0-1: brush-border disaccharidase (lactase) activity, drawn on the microvilli. */
  brushBorderEnzyme?: number;
  /** 0-1: active crypt secretion, drawn as arrows rising out of the crypts. */
  cryptSecretion?: number;
  /** 0-1: absorbed water-soluble product in the capillary. */
  capillaryLoad?: number;
  /** 0-1: chylomicrons in the lacteal. */
  lactealLoad?: number;
  /** The route of one picked product, drawn from the lumen into its exit vessel. */
  route?: VillusRoute;
  /** Colonic mucosa: crypts and no villi. */
  flat?: boolean;
  colorToken?: string;
  enzymeToken?: string;
  secretionToken?: string;
}

export interface VillusDrawing extends TissueDrawing {
  /** Anchors in the caller's frame, for leaders. */
  tip: [number, number];
  brushBorder: [number, number];
  enterocyte: [number, number];
  goblet: [number, number];
  capillary: [number, number];
  lacteal: [number, number];
  crypt: [number, number];
  /** The far villus's outer face, for a close-up inset drawn beside the tissue. */
  inset: [number, number];
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const f = (n: number) => n.toFixed(1);

/* Type-only imports, deliberately: `node --experimental-strip-types` can then load this file on
 * its own to preview a shape, exactly as it can `organShapes.ts`. So the one helper this needs
 * from there is restated rather than imported. Tissue is never mirrored, so there is no flip. */
function placedAt(placement: OrganPlacement, p: readonly [number, number]): [number, number] {
  const s = placement.scale ?? 1;
  return [placement.x + p[0] * s, placement.y + p[1] * s];
}

/** Many small dots as one round-capped path — restated from `dotsPath` in organShapes for the
 * same standalone reason as `placedAt`. */
function dots(points: readonly (readonly [number, number])[], r: number, token: string): PathNode[] {
  if (points.length === 0) return [];
  return [
    {
      type: 'path',
      d: points.map(([x, y]) => `M${f(x)},${f(y)} h0.01`).join(' '),
      fill: 'none',
      colorToken: token,
      strokeWidth: r * 2,
      strokeLinecap: 'round',
    },
  ];
}

function finger(cx: number, tip: number, half: number): string {
  return `M${f(cx - half)},${VILLUS_BASE} L${f(cx - half)},${f(tip + half)} A${half},${half} 0 0 1 ${f(cx + half)},${f(tip + half)} L${f(cx + half)},${VILLUS_BASE}`;
}

export function villusScene(placement: OrganPlacement, params: VillusParams = {}): VillusDrawing {
  const token = params.colorToken ?? 'capillary';
  const enzymeToken = params.enzymeToken ?? 'glucose';
  const secretionToken = params.secretionToken ?? 'tubule';
  const flat = params.flat ?? false;
  const height = flat ? 0 : clamp01(params.villusHeight ?? 1);
  const secretion = clamp01(params.cryptSecretion ?? 0);
  const markerId = `villus-secretion-${secretionToken}`;
  const routeMarkerId = params.route ? `villus-route-${params.route.token}` : null;

  const path = (d: string, extra: Partial<PathNode>): PathNode => ({ type: 'path', d, fill: 'none', ...extra });

  /* Villous atrophy flattens the villi and deepens the crypts beneath them — crypt hyperplasia is
   * the other half of the coeliac biopsy, and drawing only the first half would miss it. */
  const villusTop = VILLUS_BASE - (18 + 118 * height);
  const cryptDepth = flat ? 38 : 20 + (1 - height) * 16;
  const surfaceY = flat ? 70 : VILLUS_BASE;

  const nodes: SceneNode[] = [];

  /* Lamina propria and crypts: the mucosa everything stands on. */
  nodes.push({ type: 'rect', x: 0, y: surfaceY, width: 250, height: MUSCULARIS - surfaceY, fill: token, fillOpacity: 0.1 });
  nodes.push(path(`M0,${MUSCULARIS} H250`, { colorToken: token, strokeWidth: 3, strokeOpacity: 0.55 }));

  const cryptXs = flat ? [25, 75, 125, 175, 225] : [5, 85, 165, 245];
  const cryptBottom = surfaceY + (flat ? 110 : cryptDepth + 12);
  for (const x of cryptXs) {
    // A crypt: an invagination lined by the same epithelium, drawn as a U.
    nodes.push(
      path(`M${x - 7},${surfaceY} L${x - 7},${f(cryptBottom - 7)} A7,7 0 0 0 ${x + 7},${f(cryptBottom - 7)} L${x + 7},${surfaceY}`, {
        colorToken: token,
        strokeWidth: EPITHELIUM,
        strokeOpacity: 0.45,
        strokeLinecap: 'butt',
      }),
    );
  }

  if (flat) {
    // The colonic surface: a straight epithelial band, brush border above it.
    nodes.push(path(`M0,${surfaceY} H250`, { colorToken: token, strokeWidth: EPITHELIUM * 2, strokeOpacity: 0.45, strokeLinecap: 'butt' }));
    const microvilli: string[] = [];
    for (let x = 3; x < 250; x += 4) microvilli.push(`M${x},${surfaceY - EPITHELIUM} v-4`);
    nodes.push(path(microvilli.join(' '), { colorToken: token, strokeWidth: 1, strokeOpacity: 0.7 }));
    for (const x of [50, 100, 150, 200]) {
      nodes.push({ type: 'circle', cx: x, cy: surfaceY + 2, r: 4, fill: token, fillOpacity: 0.12, stroke: token, strokeWidth: 1 });
    }
  } else {
    for (const cx of VILLUS_CENTRES) {
      const outer = finger(cx, villusTop, VILLUS_HALF);
      const inner = finger(cx, villusTop + EPITHELIUM, VILLUS_HALF - EPITHELIUM);
      nodes.push({ type: 'path', d: `${outer} Z`, fill: 'panel' });
      nodes.push({ type: 'path', d: `${outer} Z`, fill: token, fillOpacity: 0.42 });
      nodes.push({ type: 'path', d: `${inner} Z`, fill: 'panel' });
      nodes.push({ type: 'path', d: `${inner} Z`, fill: token, fillOpacity: 0.08 });
      nodes.push(path(outer, { colorToken: token, strokeWidth: 1.6 }));

      /* Cell boundaries across the epithelial band, so it reads as a sheet of enterocytes rather
       * than as a coloured outline — and the brush border's microvilli along both faces and over
       * the tip. Each set is ONE path of many strokes: a node per microvillus was three hundred
       * nodes for three villi, paid on every frame. */
      const cells: string[] = [];
      for (let y = VILLUS_BASE - 6; y > villusTop + VILLUS_HALF; y -= 9) {
        cells.push(`M${cx - VILLUS_HALF},${y} h${EPITHELIUM}`, `M${cx + VILLUS_HALF - EPITHELIUM},${y} h${EPITHELIUM}`);
      }
      if (cells.length > 0) nodes.push(path(cells.join(' '), { colorToken: token, strokeWidth: 0.8, strokeOpacity: 0.6 }));

      const microvilli: string[] = [];
      for (let y = VILLUS_BASE - 4; y > villusTop + VILLUS_HALF; y -= 4) {
        microvilli.push(`M${cx - VILLUS_HALF},${y} h-4`, `M${cx + VILLUS_HALF},${y} h4`);
      }
      for (let a = 10; a < 180; a += 12) {
        const rad = (a * Math.PI) / 180;
        const x0 = cx - Math.cos(rad) * VILLUS_HALF;
        const y0 = villusTop + VILLUS_HALF - Math.sin(rad) * VILLUS_HALF;
        const x1 = cx - Math.cos(rad) * (VILLUS_HALF + 4);
        const y1 = villusTop + VILLUS_HALF - Math.sin(rad) * (VILLUS_HALF + 4);
        microvilli.push(`M${f(x0)},${f(y0)} L${f(x1)},${f(y1)}`);
      }
      nodes.push(path(microvilli.join(' '), { colorToken: token, strokeWidth: 0.9, strokeOpacity: 0.7 }));
    }
  }

  /** The cut-away villus, and the one a close-up inset hangs off. */
  const mid = VILLUS_CENTRES[0];
  const far = VILLUS_CENTRES[2];
  const core = { top: villusTop + EPITHELIUM + 10, base: VILLUS_BASE + 8 };

  /* The disaccharidase on the brush border — lactase, sucrase-isomaltase — drawn as beads on the
   * microvilli of the cut-away villus. Few beads, not paler beads: a lactase-deficient
   * border has less enzyme, not a fainter one. */
  const enzyme = clamp01(params.brushBorderEnzyme ?? 1);
  const beadSlots = flat ? [] : Array.from({ length: Math.max(0, Math.floor((VILLUS_BASE - 8 - (villusTop + VILLUS_HALF)) / 8)) }, (_, i) => VILLUS_BASE - 8 - i * 8);
  const beadCount = Math.round(beadSlots.length * enzyme);
  nodes.push(
    ...dots(
      beadSlots.slice(0, beadCount).flatMap((y): [number, number][] => [
        [mid - VILLUS_HALF - 4.5, y],
        [mid + VILLUS_HALF + 4.5, y - 4],
      ]),
      1.6,
      enzymeToken,
    ),
  );

  /* Goblet cell: a mucus-filled cup among the enterocytes. */
  const gobletY = flat ? surfaceY + 2 : Math.max(villusTop + VILLUS_HALF + 14, VILLUS_BASE - 34);
  const goblet: [number, number] = flat ? [100, surfaceY + 2] : [mid - VILLUS_HALF + EPITHELIUM / 2, gobletY];
  if (!flat) {
    nodes.push({ type: 'circle', cx: goblet[0], cy: goblet[1], r: 4.2, fill: 'panel' });
    nodes.push({ type: 'circle', cx: goblet[0], cy: goblet[1], r: 4.2, fill: token, fillOpacity: 0.12, stroke: token, strokeWidth: 1 });
  }

  /* The core of the cut-away villus: capillary loop and lacteal. On a flat mucosa the capillaries run
   * in the lamina propria between the crypts. */
  const capillaryUp = flat ? `M60,${MUSCULARIS - 4} C60,120 64,90 70,${surfaceY + 14}` : `M${mid - 9},${core.base} L${mid - 9},${f(core.top + 6)}`;
  const capillaryTop = flat ? `M70,${surfaceY + 14} C78,${surfaceY + 8} 86,${surfaceY + 8} 92,${surfaceY + 14}` : `M${mid - 9},${f(core.top + 6)} A9,9 0 0 1 ${mid + 9},${f(core.top + 6)}`;
  const capillaryDown = flat ? `M92,${surfaceY + 14} C98,90 102,120 104,${MUSCULARIS - 4}` : `M${mid + 9},${f(core.top + 6)} L${mid + 9},${core.base}`;
  nodes.push(path(capillaryUp, { colorToken: 'artery', strokeWidth: 3, strokeOpacity: 0.85 }));
  nodes.push(path(capillaryTop, { colorToken: 'artery', strokeWidth: 3, strokeOpacity: 0.6 }));
  nodes.push(path(capillaryDown, { colorToken: 'venous', strokeWidth: 3, strokeOpacity: 0.85 }));

  const capillaryLoad = clamp01(params.capillaryLoad ?? 0);
  const capillaryDots = Math.round(capillaryLoad * 6);
  nodes.push(
    ...dots(
      Array.from({ length: capillaryDots }, (_, i): [number, number] => [
        flat ? 103 - i * 1.5 : mid + 9,
        flat ? MUSCULARIS - 14 - i * 14 : core.base - 6 - i * ((core.base - core.top - 12) / 6),
      ]),
      1.8,
      'venous',
    ),
  );

  const lactealTop = core.top + 16;
  if (!flat) {
    nodes.push(path(`M${mid},${core.base} L${mid},${f(lactealTop)}`, { colorToken: 'lymph', strokeWidth: 6, strokeOpacity: 0.35 }));
    nodes.push(path(`M${mid},${core.base} L${mid},${f(lactealTop)}`, { colorToken: 'lymph', strokeWidth: 1.2 }));
    const lactealLoad = clamp01(params.lactealLoad ?? 0);
    const chylomicrons = Math.round(lactealLoad * 6);
    nodes.push(
      ...dots(
        Array.from({ length: chylomicrons }, (_, i): [number, number] => [mid, lactealTop + 6 + i * ((core.base - lactealTop - 10) / 6)]),
        2.2,
        'lymph',
      ),
    );
  }

  /* Crypt secretion: chloride and water rising out of the crypts into the lumen. Cholera toxin,
   * VIP and spilt bile salts all drive this same pump; the villi absorb, the crypts secrete. */
  const arrowsPerCrypt = Math.round(secretion * 3);
  const defs: DefNode[] = [{ type: 'marker', id: markerId, colorToken: secretionToken }];
  for (const x of cryptXs) {
    for (let k = 0; k < arrowsPerCrypt; k += 1) {
      const y0 = cryptBottom - 10 - k * 14;
      nodes.push(path(`M${x},${f(y0)} L${x},${f(y0 - 10)}`, { colorToken: secretionToken, strokeWidth: 1.6, markerEnd: markerId }));
    }
  }

  /* The route of the one product the caller picked: from the lumen beside the cut-away villus,
   * through an enterocyte, and out by its exit vessel. */
  if (params.route && routeMarkerId) {
    defs.push({ type: 'marker', id: routeMarkerId, colorToken: params.route.token });
    const entryX = flat ? 128 : mid - VILLUS_HALF - 14;
    const entryY = flat ? surfaceY - 22 : villusTop + VILLUS_HALF + 16;
    const cellX = flat ? 128 : mid - VILLUS_HALF + EPITHELIUM / 2;
    const exit =
      params.route.via === 'lacteal'
        ? `C${f(cellX + 6)},${f(entryY + 14)} ${mid - 2},${f(entryY + 14)} ${mid - 1},${f(entryY + 26)} L${mid - 1},${core.base - 2}`
        : flat
          ? `C128,110 110,120 104,${MUSCULARIS - 8}`
          : `C${f(cellX + 4)},${f(entryY + 12)} ${mid - 12},${f(entryY + 10)} ${mid - 9},${f(entryY + 22)}`;
    nodes.push(
      path(`M${entryX},${f(entryY - 6)} C${f(entryX + 6)},${f(entryY - 2)} ${f(cellX - 4)},${f(entryY)} ${f(cellX)},${f(entryY + 2)} ${exit}`, {
        colorToken: params.route.token,
        // Thin on purpose: the arrowhead is sized in stroke widths, and at 2.4 it covered the crypt.
        strokeWidth: 1.5,
        markerEnd: routeMarkerId,
      }),
    );
  }

  const node: GroupNode = {
    type: 'group',
    transform: `translate(${placement.x}, ${placement.y})${placement.scale && placement.scale !== 1 ? ` scale(${placement.scale})` : ''}`,
    children: nodes,
  };

  const at = (p: [number, number]) => placedAt(placement, p);

  return {
    node,
    defs,
    tip: at(flat ? [125, surfaceY - 6] : [mid, villusTop]),
    brushBorder: at(flat ? [40, surfaceY - 9] : [mid - VILLUS_HALF - 3, villusTop + VILLUS_HALF + 6]),
    enterocyte: at(flat ? [150, surfaceY] : [mid - VILLUS_HALF + EPITHELIUM / 2, VILLUS_BASE - 14]),
    goblet: at(goblet),
    capillary: at(flat ? [100, 130] : [mid + 9, core.base - 16]),
    lacteal: at(flat ? [60, 130] : [mid, core.base - 30]),
    crypt: at([cryptXs[1] ?? 85, cryptBottom - 4]),
    inset: at(flat ? [238, surfaceY + 4] : [far + VILLUS_HALF + 3, Math.max(villusTop + VILLUS_HALF + 20, VILLUS_BASE - 40)]),
  };
}
