import type {
  CircleNode,
  DefNode,
  GroupNode,
  PathNode,
  RadialGradientNode,
  SceneNode,
} from '@/shared/presentation/types';

/** Raw SVG path strings reused across module diagrams, kept separate from any one component's animation/behavior. */
export const KIDNEY_PATH =
  'M-8,-32 C10,-36 24,-22 22,-4 C21,6 10,4 6,13 C2,21 10,26 18,24 C26,34 14,44 -2,42 C-20,39 -26,18 -22,-2 C-19,-20 -18,-28 -8,-32 Z';

/** A loosely coiled ribbon representing a run of small intestine (duodenum onward) —
 * stylized, not anatomically literal, matching the rest of the app's hand-drawn organs. */
export const SMALL_INTESTINE_PATH =
  'M-40,-10 C-30,-24 -10,-24 0,-10 C10,4 30,4 40,-10 C46,-2 46,10 38,16 C26,24 14,10 0,16 C-14,22 -26,8 -38,16 C-46,10 -46,-2 -40,-10 Z';

/** Elongated leaf shape representing the pancreas, tucked behind/below the stomach. */
export const PANCREAS_PATH = 'M-32,-6 C-30,-14 -18,-16 -6,-14 C10,-12 26,-8 34,0 C30,8 14,10 -2,8 C-16,6 -28,4 -32,-6 Z';

/** Broad wedge representing the liver — larger right lobe tapering to a left lobe. */
export const LIVER_PATH = 'M-38,-16 C-16,-26 20,-26 38,-14 C42,4 30,22 6,26 C-14,29 -34,20 -40,2 C-41,-5 -40,-12 -38,-16 Z';

/* ==================================================================== */
/*  Anatomy                                                             */
/*                                                                      */
/*  The shapes above are the app's first generation: one Bézier         */
/*  silhouette per organ, filled with a flat wash. What follows replaces */
/*  them organ by organ with drawings that are anatomically truthful —   */
/*  chambers, lobes, fissures, curvatures, vessel trees — and shaded so  */
/*  they read as solids rather than as stickers.                        */
/*                                                                      */
/*  Three rules make this survivable in two apps, two themes and        */
/*  forty-seven modules:                                                */
/*                                                                      */
/*  1. A builder returns SCENE NODES, not JSX. The `organ` node type is  */
/*     drawn by two hand-written per-platform registries, so anatomy     */
/*     written there has to be written twice and drifts. A builder emits */
/*     ordinary group/path nodes that both renderers already handle, so  */
/*     an organ is drawn once for the web and the phone alike.          */
/*                                                                      */
/*  2. Shading is the organ's OWN colour getting denser, never white or  */
/*     black. A highlight painted in white survives the light theme and  */
/*     disappears on the dark one; the same hue at 16% against the same  */
/*     hue at 68% reads as volume under both, and keeps every colour the */
/*     app draws inside the token palette `palette.test.ts` checks.     */
/*                                                                      */
/*  3. The COLOUR is the caller's, not the organ's. The pancreas is the  */
/*     insulin colour in glucoseRegulation and the CCK colour in         */
/*     gastrointestinal, because in each it is drawn for a different     */
/*     reason. A builder that hardcoded one would have forced the other  */
/*     module to keep its own copy, which is the duplication this whole  */
/*     library exists to end. So every builder takes a token, and hands  */
/*     back the gradient defs that go with it.                          */
/* ==================================================================== */

/**
 * What a builder returns: the drawing, and the gradient defs it references.
 *
 * They travel together because a `fillGradientId` with no matching def renders as black — an
 * organ that silently turns into a silhouette is exactly the failure a separate `X_DEFS` export
 * invites the first time someone adds a shape and forgets the second import.
 */
export interface OrganDrawing {
  node: GroupNode;
  defs: readonly DefNode[];
}

/** The three shading stops every organ body uses, as a fraction of the organ's own colour.
 * Light falls from the top-left, consistently across the whole app. */
const BODY_STOPS = [
  { offset: 0, opacity: 0.16 },
  { offset: 0.55, opacity: 0.4 },
  { offset: 1, opacity: 0.68 },
] as const;

/** Where an organ's light source sits, in the organ's own coordinates. */
interface LightSource {
  x: number;
  y: number;
  r: number;
}

/** The id a builder and its def agree on, so the two can never be wired up to different names. */
function gradientId(organ: string, colorToken: string): string {
  return `anat-${organ}-${colorToken}`;
}

/**
 * A body gradient in `colorToken`, lit from the top-left.
 *
 * `light` puts the source in the ORGAN's coordinates rather than in each shape's own box, which
 * is the difference between a heart lit as one solid and four chambers each lit separately —
 * the second reads as a patchwork however good the individual shapes are. Pass it for any organ
 * drawn as more than one piece; leave it off for a single-shape organ, where the shape's own
 * bounding box is the right frame.
 */
export function bodyGradient(organ: string, colorToken: string, light?: LightSource): RadialGradientNode {
  const id = gradientId(organ, colorToken);
  const stops = BODY_STOPS.map((stop) => ({ offset: stop.offset, colorToken, opacity: stop.opacity }));
  if (!light) return { type: 'radialGradient', id, cx: 0.35, cy: 0.3, r: 0.85, stops };
  return { type: 'radialGradient', id, units: 'userSpaceOnUse', cx: light.x, cy: light.y, r: light.r, stops };
}

/**
 * An organ painted in the panel colour, under its own wash.
 *
 * Without this, every organ is a stained-glass window: the wash is translucent, so the aorta
 * behind the atria, the renal artery behind the capsule and whatever else the diagram drew
 * first all show straight through the organ meant to be in front of them. `panel` is the colour
 * of the ground the diagram sits on in BOTH themes, so an underlay in it occludes without
 * introducing a colour, and the wash above it lands on the same neutral it would have landed on
 * had nothing been behind at all.
 */
export function opaqueUnderlay(d: string): PathNode {
  return { type: 'path', d, fill: 'panel' };
}

/**
 * A tube — a vessel, a bronchus, a duct — as three strokes of one path.
 *
 * A single translucent stroke has no edge, so a great vessel never became more than a pale
 * smudge. Three passes give it one: the token at full strength is the wall, the panel colour
 * inside it makes the lumen opaque so nothing behind shows through, and the token again at a low
 * opacity is the wash that says which vessel it is. Round caps mean an end that leaves the
 * drawing does not look like a cut-off rectangle.
 */
export function tubeNodes(d: string, colorToken: string, width: number, opacity = 0.34): PathNode[] {
  const inner = Math.max(width - 2.6, 0.6);
  const stroke = (w: number, token: string, strokeOpacity?: number): PathNode => ({
    type: 'path',
    d,
    fill: 'none',
    colorToken: token,
    strokeWidth: w,
    strokeOpacity,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  });
  return [stroke(width, colorToken), stroke(inner, 'panel'), stroke(inner, colorToken, opacity)];
}

/** Options every organ builder takes: where to put it, and how big relative to its natural size. */
export interface OrganPlacement {
  x: number;
  y: number;
  /** Multiplier on the organ's natural size. 1 draws it at the dimensions documented above it. */
  scale?: number;
  /** Mirror horizontally — the second kidney, the other lung, a left-sided variant. */
  flip?: boolean;
}

function placed(placement: OrganPlacement, cls: string | undefined, children: readonly SceneNode[]): GroupNode {
  const { x, y, scale, flip } = placement;
  const parts = [`translate(${x}, ${y})`];
  if (scale && scale !== 1) parts.push(`scale(${scale})`);
  if (flip) parts.push('scale(-1, 1)');
  return { type: 'group', cls, transform: parts.join(' '), children };
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/* --- Heart ---------------------------------------------------------- */
/*
 * Anterior view, the orientation every textbook plate and every chest film uses: image left is
 * the patient's right. That is what makes the drawing readable next to anything else a student
 * looks at, and it is why the apex points down and to the image RIGHT.
 *
 * Natural size: about 90 wide by 92 tall for the heart itself, about 90 by 145 with its great
 * vessels. The chambers TILE the silhouette — they share the atrioventricular and anterior
 * interventricular grooves as boundaries rather than overlapping — so each can carry its own
 * shading without a seam showing where two washes stack.
 */

/** Atrioventricular groove: the boundary between the atria above and the ventricles below. */
const HEART_AV_GROOVE = 'M-40,2 C-28,10 -12,13 4,10 C18,7 30,-4 36,-18';
/** Anterior interventricular groove, carrying the left anterior descending artery to the apex. */
const HEART_IV_GROOVE = 'M4,10 C11,25 21,41 32,55';

export const HEART_RA_PATH = 'M-2,-28 L-26,-30 C-38,-24 -42,-8 -40,2 C-28,10 -12,13 -2,11 Z';
export const HEART_LA_PATH =
  'M-2,-28 C12,-28 24,-26 30,-22 C34,-21 36,-20 36,-18 C30,-4 18,7 4,10 C2,10 0,11 -2,11 Z';
export const HEART_RV_PATH =
  'M-40,2 C-28,10 -12,13 4,10 C11,25 21,41 32,55 L28,56 C13,57 0,53 -8,48 C-24,38 -34,24 -38,8 Z';
export const HEART_LV_PATH =
  'M4,10 C11,25 21,41 32,55 L38,60 C42,44 45,22 43,2 C42,-12 39,-17 36,-18 C30,-4 18,7 4,10 Z';
/** The union of the four chambers, stroked last so detail never eats the silhouette. */
export const HEART_OUTLINE_PATH =
  'M-26,-30 C-38,-24 -42,-8 -38,8 C-34,24 -24,38 -8,48 C10,57 26,60 38,60 C42,44 45,22 43,2 C42,-12 38,-20 30,-22 C24,-26 12,-28 -2,-28 Z';

export const SVC_PATH = 'M-19,-62 C-19,-48 -19,-36 -16,-27';
export const IVC_PATH = 'M-21,2 C-23,14 -24,26 -24,44';
/** Ascending aorta, arch and the start of the descending aorta. */
export const AORTA_PATH = 'M8,-20 C2,-36 2,-50 10,-56 C20,-63 34,-58 36,-46 C37,-38 36,-30 35,-24';
/** The arch's three branches, in their anatomical order along it: brachiocephalic, left common
 * carotid, left subclavian. */
export const AORTIC_BRANCH_PATHS = [
  'M13,-57 C11,-67 10,-72 9,-79',
  'M20,-59 C20,-69 20,-75 20,-81',
  'M27,-57 C29,-67 31,-72 33,-78',
] as const;
/** Pulmonary trunk, arising anterior to the aortic root from the right ventricular outflow. */
export const PULMONARY_TRUNK_PATH = 'M-4,-20 C-8,-34 -4,-44 6,-48';
export const PULMONARY_ARTERY_PATHS = ['M3,-47 C-6,-45 -14,-44 -22,-43', 'M10,-48 C15,-48 19,-48 22,-48'] as const;

/** Right coronary artery, in the right atrioventricular groove. */
const RCA_PATH = 'M0,10 C-14,13 -30,10 -38,2';
/** Circumflex, running left in the same groove. */
const CIRCUMFLEX_PATH = 'M6,10 C18,7 28,-2 34,-14';
/** Diagonal branches off the LAD, which is what makes the anterior wall look supplied. */
const LAD_BRANCH_PATHS = ['M11,25 L23,20', 'M21,41 L32,36'] as const;

const HEART_LIGHT: LightSource = { x: -14, y: -18, r: 96 };

/** The four chambers, for a caller that needs to colour or shade them one at a time. */
export type HeartRegion = 'ra' | 'rv' | 'la' | 'lv';

export interface HeartParams {
  /** Beats per minute, driving the beat animation on the web. */
  heartRate?: number;
  /** Stroke volume as a multiple of normal — the heart visibly fills and empties by more. */
  strokeVolumeScale?: number;
  /** The right heart's colour. Venous by default, because that is the blood in it. */
  rightToken?: string;
  /** The left heart's colour. */
  leftToken?: string;
  /**
   * One chamber's colour, overriding the side it belongs to.
   *
   * Some modules are ABOUT a chamber rather than about a side. ecgConduction lights each region
   * as the wavefront reaches it, so the atria and ventricles are coloured by what the conduction
   * system is doing rather than by which blood is in them; fetalCirculation and shockStates tint
   * individual chambers for shunt and for filling. Without this they could not use this builder
   * at all, and all three drew their own chambers as rectangles instead.
   */
  regionTokens?: Partial<Record<HeartRegion, string>>;
  /** One chamber's fill strength, 0-1. The same three callers use it to show activation or
   *  filling as a depth rather than as a hue. */
  regionOpacity?: Partial<Record<HeartRegion, number>>;
}

/**
 * A four-chamber heart with its great vessels and coronary arteries.
 *
 * `beat` and `beatVolume` are the two shared animation classes; every colour and opacity is on
 * the nodes themselves, so the phone renders the same drawing with no stylesheet of its own.
 */
export function heartScene(placement: OrganPlacement, params: HeartParams = {}): OrganDrawing {
  const right = params.rightToken ?? 'venous';
  const left = params.leftToken ?? 'artery';

  /* A chamber takes the side's gradient unless the caller named a colour for that chamber, in
   * which case it is a flat fill: a gradient is depth, and a per-region colour is DATA, so the
   * two must not be carried by the same paint. `regionOpacity` shades it without changing hue. */
  const chamber = (d: string, region: HeartRegion, sideToken: string): PathNode => {
    const token = params.regionTokens?.[region];
    const opacity = params.regionOpacity?.[region];
    if (token === undefined && opacity === undefined) {
      return { type: 'path', d, fillGradientId: gradientId('heart', sideToken) };
    }
    return { type: 'path', d, fill: token ?? sideToken, fillOpacity: opacity ?? 1 };
  };

  const node = placed(placement, undefined, [
    {
      type: 'group',
      cls: 'beat',
      styleVars: { 'hr-bpm': params.heartRate ?? 70 },
      children: [
        {
          type: 'group',
          cls: 'beatVolume',
          styleVars: { 'sv-scale': params.strokeVolumeScale ?? 1 },
          children: [
            /* Great vessels first, so they emerge from BEHIND the base of the heart rather than
             * being pasted over the atria. The arch is drawn before the pulmonary trunk because
             * the trunk passes in front of the ascending aorta and under the arch. */
            ...AORTIC_BRANCH_PATHS.flatMap((d) => tubeNodes(d, left, 6)),
            ...tubeNodes(AORTA_PATH, left, 12),
            ...PULMONARY_ARTERY_PATHS.flatMap((d) => tubeNodes(d, right, 7)),
            ...tubeNodes(PULMONARY_TRUNK_PATH, right, 11),
            ...tubeNodes(SVC_PATH, right, 13),
            ...tubeNodes(IVC_PATH, right, 14),

            /* The heart itself is in FRONT of its great vessels, so the silhouette is painted
             * opaque before the chambers go down — otherwise the aorta reads as running through
             * the left atrium rather than behind it. */
            opaqueUnderlay(HEART_OUTLINE_PATH),

            chamber(HEART_RA_PATH, 'ra', right),
            chamber(HEART_RV_PATH, 'rv', right),
            chamber(HEART_LA_PATH, 'la', left),
            chamber(HEART_LV_PATH, 'lv', left),

            /* Grooves, then the silhouette, then the coronaries on top of both. */
            { type: 'path', d: HEART_AV_GROOVE, fill: 'none', colorToken: left, strokeWidth: 1.6, strokeOpacity: 0.75 },
            { type: 'path', d: HEART_IV_GROOVE, fill: 'none', colorToken: left, strokeWidth: 1.6, strokeOpacity: 0.75 },
            { type: 'path', d: HEART_OUTLINE_PATH, fill: 'none', colorToken: left, strokeWidth: 2.4, strokeLinejoin: 'round' },
            ...[RCA_PATH, CIRCUMFLEX_PATH, HEART_IV_GROOVE, ...LAD_BRANCH_PATHS].map(
              (d): PathNode => ({ type: 'path', d, fill: 'none', colorToken: left, strokeWidth: 2, strokeLinecap: 'round' }),
            ),
          ],
        },
      ],
    },
  ]);

  return { node, defs: [bodyGradient('heart', right, HEART_LIGHT), bodyGradient('heart', left, HEART_LIGHT)] };
}

/* --- Kidney --------------------------------------------------------- */
/*
 * Coronal section, hilum facing the image left, because everything this app models about the
 * kidney is internal: the cortex the glomeruli sit in, the medullary pyramids the loops descend
 * into, the calyces and pelvis the urine leaves by. An intact bean says none of that.
 *
 * Natural size: about 56 wide by 80 tall, or 90 wide with the hilar vessels.
 */

/** The renal capsule — a bean whose concavity is the hilum. */
export const KIDNEY_CAPSULE_PATH =
  'M2,-38 C18,-38 30,-22 30,0 C30,22 18,38 2,38 C-10,38 -20,30 -22,18 C-23,12 -18,8 -14,4 C-11,1 -11,-1 -14,-4 C-18,-8 -23,-12 -22,-18 C-20,-30 -10,-38 2,-38 Z';
/** The corticomedullary junction: everything inside it is medulla, everything outside is cortex. */
export const KIDNEY_MEDULLA_PATH =
  'M2,-29 C14,-29 22,-16 22,0 C22,16 14,29 2,29 C-7,29 -14,23 -15,14 C-15,10 -11,7 -8,4 C-6,1 -6,-1 -8,-4 C-11,-7 -15,-10 -15,-14 C-14,-23 -7,-29 2,-29 Z';
/** Renal pelvis, funnelling the calyces into the ureter. */
export const RENAL_PELVIS_PATH =
  'M-5,-17 C-14,-13 -19,-6 -19,0 C-19,6 -14,13 -5,17 C-9,10 -10,5 -10,0 C-10,-5 -9,-10 -5,-17 Z';

/** Where each medullary pyramid points, in degrees either side of the hilar axis. */
const PYRAMID_ANGLES = [-62, -37, -12, 12, 37, 62] as const;
const PYRAMID_CENTRE_X = -3;

const radians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * One pyramid: apex at a minor calyx near the pelvis, base out at the corticomedullary
 * junction. Generated rather than hand-authored so the six stay regular — a pyramid a degree
 * out of line reads as a mistake in a way a hand-drawn organ outline never does.
 */
function pyramidPath(degrees: number): string {
  const apexR = 10;
  const baseR = 24;
  const halfWidth = 11;
  const at = (r: number, angle: number) =>
    `${(PYRAMID_CENTRE_X + r * Math.cos(angle)).toFixed(1)},${(r * Math.sin(angle)).toFixed(1)}`;
  // The base follows the corticomedullary junction rather than cutting straight across it.
  return `M${at(apexR, radians(degrees))} L${at(baseR, radians(degrees - halfWidth))} Q${at(baseR + 2, radians(degrees))} ${at(baseR, radians(degrees + halfWidth))} Z`;
}

export const RENAL_ARTERY_PATH = 'M-44,-12 C-32,-11 -24,-9 -16,-7';
export const RENAL_VEIN_PATH = 'M-44,2 C-32,2 -24,1 -15,0';
/** The ureter as it leaves the pelvis. How far it runs is the calling diagram's business. */
export const URETER_PATH = 'M-16,9 C-21,18 -23,28 -23,42';

export interface KidneyParams {
  /** Filtration as a multiple of normal, drawn as how strongly the cortex is washed. */
  gfrIntensity?: number;
  /** The organ's colour. */
  colorToken?: string;
  /** The medulla's colour, which is darker than the cortex in every atlas ever printed. */
  medullaToken?: string;
}

/**
 * A sectioned kidney: capsule, cortex, six medullary pyramids, minor calyces, pelvis, and the
 * hilar artery and vein.
 *
 * The cortex carries `gfrIntensity` as its opacity, so filtration is something the learner SEES
 * in the layer that does the filtering rather than only reads in a tile.
 */
export function kidneyScene(placement: OrganPlacement, params: KidneyParams = {}): OrganDrawing {
  const token = params.colorToken ?? 'kidney';
  const medulla = params.medullaToken ?? 'medulla';
  const cortexOpacity = Math.max(0.12, Math.min(0.75, (params.gfrIntensity ?? 1) * 0.45));

  const node = placed(placement, undefined, [
    // Hilar vessels first, so the capsule occludes them where they enter rather than the other
    // way round. Artery above, vein below it — the anatomical order at the hilum.
    ...tubeNodes(RENAL_ARTERY_PATH, 'artery', 5),
    ...tubeNodes(RENAL_VEIN_PATH, 'venous', 6),
    opaqueUnderlay(KIDNEY_CAPSULE_PATH),
    { type: 'path', d: KIDNEY_CAPSULE_PATH, fillGradientId: gradientId('kidney', token), fillOpacity: cortexOpacity },
    // A darker medullary field the pyramids sit in, so a pyramid never floats on the cortex.
    { type: 'path', d: KIDNEY_MEDULLA_PATH, fill: medulla, fillOpacity: 0.16 },
    ...PYRAMID_ANGLES.map(
      (degrees): PathNode => ({
        type: 'path',
        d: pyramidPath(degrees),
        fill: medulla,
        fillOpacity: 0.42,
        colorToken: medulla,
        strokeWidth: 0.8,
        strokeOpacity: 0.5,
      }),
    ),
    // Minor calyces: the cups the pyramids drain into.
    ...PYRAMID_ANGLES.map((degrees): CircleNode => {
      const a = radians(degrees);
      return { type: 'circle', cx: PYRAMID_CENTRE_X + 11 * Math.cos(a), cy: 11 * Math.sin(a), r: 2.2, fill: 'urine', fillOpacity: 0.6 };
    }),
    { type: 'path', d: RENAL_PELVIS_PATH, fill: 'urine', fillOpacity: 0.3, colorToken: 'urine', strokeWidth: 1.2 },
    { type: 'path', d: KIDNEY_CAPSULE_PATH, fill: 'none', colorToken: token, strokeWidth: 2.2 },
    { type: 'path', d: KIDNEY_MEDULLA_PATH, fill: 'none', colorToken: token, strokeWidth: 1, strokeOpacity: 0.45 },
  ]);

  return { node, defs: [bodyGradient('kidney', token)] };
}

/* --- Lungs ---------------------------------------------------------- */
/*
 * Anterior view. The lobes are the point: three on the right, two on the left, and the left one
 * short of a lobe because the heart is in the way. A student who has only ever seen this app's
 * two symmetrical balloons has been shown that the lungs are symmetrical, which is the single
 * most consequential thing about them that is not true — it is why aspiration goes right, and
 * why "left lower lobe" and "right middle lobe" mean different things on a film.
 *
 * Natural size: about 140 wide by 140 tall, or 180 tall with the trachea and the diaphragm.
 */

export const RIGHT_LUNG_PATH =
  'M-32,-58 C-48,-54 -60,-36 -65,-10 C-69,16 -66,40 -58,50 C-52,57 -32,58 -24,50 C-19,42 -17,26 -19,8 C-20,0 -22,-4 -19,-8 C-15,-13 -17,-30 -23,-44 C-26,-52 -29,-57 -32,-58 Z';
/** The left lung, one lobe short and carrying the cardiac notch the heart sits in. */
export const LEFT_LUNG_PATH =
  'M32,-58 C48,-54 60,-36 65,-10 C69,16 66,40 58,50 C52,57 36,58 30,50 C26,44 32,34 30,22 C29,14 23,10 22,4 C21,0 22,-4 19,-8 C15,-13 17,-30 23,-44 C26,-52 29,-57 32,-58 Z';

/** Right oblique fissure — upper and middle lobes in front of it, lower lobe behind and below. */
export const RIGHT_OBLIQUE_FISSURE = 'M-64,-14 C-56,4 -44,26 -28,50';
/** Right horizontal fissure, the one the left lung has no equivalent of. */
export const RIGHT_HORIZONTAL_FISSURE = 'M-52,2 C-40,4 -28,6 -19,6';
export const LEFT_OBLIQUE_FISSURE = 'M64,-14 C56,6 44,28 28,50';

export const TRACHEA_PATH = 'M0,-98 L0,-64';
/** Right main bronchus: wider, shorter and more vertical than the left, which is why an inhaled
 * peanut ends up in the right lung. Drawn that way rather than stated. */
export const RIGHT_MAIN_BRONCHUS = 'M0,-64 C-6,-57 -12,-52 -19,-46';
export const LEFT_MAIN_BRONCHUS = 'M0,-64 C8,-59 16,-54 25,-50';
const LOBAR_BRONCHI = [
  'M-13,-51 C-20,-56 -28,-58 -35,-56',
  'M-19,-46 C-26,-42 -32,-38 -37,-33',
  'M-19,-46 C-22,-36 -24,-26 -26,-14',
  'M19,-53 C25,-57 33,-57 39,-54',
  'M25,-50 C27,-40 28,-30 29,-18',
] as const;

/** The dome the lungs sit on. A landmark, not a signal, so it is drawn in the text ramp. */
export const DIAPHRAGM_PATH = 'M-74,52 C-54,72 -26,78 0,76 C26,78 54,72 74,52';

/** Where the alveolar units sit inside each lung, ordered apex-first. */
export const RIGHT_LUNG_UNITS = [
  { x: -44, y: -34 },
  { x: -32, y: -14 },
  { x: -50, y: -2 },
  { x: -40, y: 20 },
  { x: -48, y: 36 },
] as const;
export const LEFT_LUNG_UNITS = [
  { x: 44, y: -34 },
  { x: 34, y: -14 },
  { x: 50, y: -2 },
  { x: 42, y: 20 },
  { x: 49, y: 36 },
] as const;

export interface LungParams {
  /** Breaths per minute, driving the breathing animation on the web. */
  breathRate?: number;
  /** Tidal excursion as a multiple of normal. */
  ventDepth?: number;
  /** 0-1. Lung units still ventilated but no longer exchanging — the structure behind a widened
   * A-a gradient. Rounded to whole units, because a shunted alveolus is not a partly shunted one. */
  vqMismatch?: number;
  colorToken?: string;
  /** The colour a dropped-out unit turns. */
  mismatchToken?: string;
}

/**
 * Both lungs with their lobes, fissures, bronchial tree and the diaphragm.
 *
 * Units drop out from the bases upward, which is where V/Q mismatch actually bites: the
 * dependent lung is the well-perfused, poorly ventilated one.
 */
export function lungsScene(placement: OrganPlacement, params: LungParams = {}): OrganDrawing {
  const token = params.colorToken ?? 'o2';
  const mismatch = params.mismatchToken ?? 'vq';
  const units = [...RIGHT_LUNG_UNITS, ...LEFT_LUNG_UNITS];
  const perLung = RIGHT_LUNG_UNITS.length;
  const dead = Math.round(clamp01(params.vqMismatch ?? 0) * perLung);
  const isDead = (index: number) => index % perLung >= perLung - dead;

  const fissure = (d: string): PathNode => ({ type: 'path', d, fill: 'none', colorToken: token, strokeWidth: 1.4, strokeOpacity: 0.6 });

  const node = placed(placement, undefined, [
    {
      type: 'group',
      cls: 'breathe',
      styleVars: { 'breath-rate': params.breathRate ?? 14, 'vent-depth': params.ventDepth ?? 1 },
      children: [
        opaqueUnderlay(RIGHT_LUNG_PATH),
        opaqueUnderlay(LEFT_LUNG_PATH),
        { type: 'path', d: RIGHT_LUNG_PATH, fillGradientId: gradientId('lung', token) },
        { type: 'path', d: LEFT_LUNG_PATH, fillGradientId: gradientId('lung', token) },
        /* The airway goes down AFTER the lung fills, because it is INSIDE the lungs. Drawn
         * first it was occluded by the very organ it ventilates, which left the diagram
         * asserting that the bronchi stop at the hilum. */
        ...tubeNodes(TRACHEA_PATH, token, 13),
        ...LOBAR_BRONCHI.flatMap((d) => tubeNodes(d, token, 5)),
        ...tubeNodes(RIGHT_MAIN_BRONCHUS, token, 9),
        ...tubeNodes(LEFT_MAIN_BRONCHUS, token, 7.5),
        fissure(RIGHT_OBLIQUE_FISSURE),
        fissure(RIGHT_HORIZONTAL_FISSURE),
        fissure(LEFT_OBLIQUE_FISSURE),
        { type: 'path', d: RIGHT_LUNG_PATH, fill: 'none', colorToken: token, strokeWidth: 2.2 },
        { type: 'path', d: LEFT_LUNG_PATH, fill: 'none', colorToken: token, strokeWidth: 2.2 },
        ...units.map(
          (unit, index): CircleNode => ({
            type: 'circle',
            cx: unit.x,
            cy: unit.y,
            r: 4.5,
            fill: isDead(index) ? mismatch : token,
            fillOpacity: isDead(index) ? 0.75 : 0.5,
          }),
        ),
      ],
    },
    { type: 'path', d: DIAPHRAGM_PATH, fill: 'none', colorToken: 'text-dim', strokeWidth: 2.4, strokeOpacity: 0.5, strokeLinecap: 'round' },
  ]);

  return { node, defs: [bodyGradient('lung', token, { x: -20, y: -30, r: 130 })] };
}

/* --- Stomach -------------------------------------------------------- */
/*
 * Anterior view: oesophagus arriving top-left at the cardia, pylorus leaving bottom-right into
 * the duodenum. The named regions are the ones the physiology is about — parietal cells in the
 * BODY, gastrin-secreting G cells in the ANTRUM, and the pylorus as the rate gastric emptying
 * is a rate through. A single J-shaped sac says none of that.
 *
 * Natural size: about 112 wide by 100 tall, or 145 tall with the oesophagus.
 */

/** The sac itself: greater curvature out and down the image left, lesser curvature back. */
export const STOMACH_BODY_PATH =
  'M-36,-44 C-56,-46 -64,-24 -58,-2 C-52,20 -38,38 -16,46 C2,52 26,48 40,36 C44,32 47,30 48,28 C44,24 36,22 26,20 C8,16 -4,4 -8,-14 C-12,-30 -20,-42 -36,-44 Z';
/** The long convex left border, fundus to pylorus. */
export const STOMACH_GREATER_CURVATURE =
  'M-36,-44 C-56,-46 -64,-24 -58,-2 C-52,20 -38,38 -16,46 C2,52 26,48 40,36';
/** The short concave right border. */
export const STOMACH_LESSER_CURVATURE =
  'M-36,-44 C-20,-42 -12,-30 -8,-14 C-4,4 8,16 26,20 C36,22 44,24 48,28';
export const OESOPHAGUS_PATH = 'M-44,-88 C-44,-68 -42,-56 -37,-46';
/** The incisura angularis: the notch on the lesser curvature that marks where body ends and
 * antrum begins. The one landmark that lets an acid-secreting region be told from a
 * gastrin-secreting one without writing the names on. */
export const STOMACH_INCISURA_PATH = 'M16,18 C11,30 6,40 1,50';

/** Rugae: the folds that let the stomach take a meal without the pressure rising. */
const RUGAE_PATHS = [
  'M-48,-24 C-38,-20 -30,-12 -26,-2',
  'M-46,-8 C-34,-6 -24,2 -20,12',
  'M-40,8 C-28,12 -18,20 -14,28',
  'M-28,22 C-18,28 -8,34 0,36',
] as const;

export interface StomachParams {
  /** 0-1, how strongly the parietal cells are acidifying — drawn in the body, where they are. */
  acidIntensity?: number;
  colorToken?: string;
  /** The colour acid is drawn in, over the body's own wash. */
  acidToken?: string;
}

export function stomachScene(placement: OrganPlacement, params: StomachParams = {}): OrganDrawing {
  const token = params.colorToken ?? 'gastrin';
  const acidToken = params.acidToken ?? token;
  const acid = clamp01(params.acidIntensity ?? 0.5);

  const node = placed(placement, undefined, [
    ...tubeNodes(OESOPHAGUS_PATH, token, 12),
    opaqueUnderlay(STOMACH_BODY_PATH),
    { type: 'path', d: STOMACH_BODY_PATH, fillGradientId: gradientId('stomach', token) },
    { type: 'path', d: STOMACH_BODY_PATH, fill: acidToken, fillOpacity: acid * 0.28 },
    ...RUGAE_PATHS.map(
      (d): PathNode => ({ type: 'path', d, fill: 'none', colorToken: token, strokeWidth: 1.2, strokeOpacity: 0.42, strokeLinecap: 'round' }),
    ),
    { type: 'path', d: STOMACH_INCISURA_PATH, fill: 'none', colorToken: token, strokeWidth: 1.2, strokeOpacity: 0.5 },
    { type: 'path', d: STOMACH_BODY_PATH, fill: 'none', colorToken: token, strokeWidth: 2.2, strokeLinejoin: 'round' },
  ]);

  return { node, defs: [bodyGradient('stomach', token, { x: -40, y: -34, r: 120 })] };
}

/* --- Duodenum, jejunum and ileum ------------------------------------ */
/*
 * The C-loop is the part that has to be right: the pancreatic head sits INSIDE its concavity,
 * and the bile and pancreatic ducts arrive there. Everything distal is coils, and coils only
 * have to look like a run of bowel rather than like any particular one — which is the honest
 * position, because no two people's are alike.
 *
 * Natural size: about 100 wide by 130 tall, the C opening to the image left.
 */

/** The duodenal C, from the pylorus round to the duodenojejunal flexure. */
export const DUODENUM_PATH = 'M-40,-42 C-8,-46 12,-30 12,-8 C12,14 -6,30 -30,30';
/** Jejunum: a clean serpentine rather than a knot. Wider calibre than the ileum, as in life. */
export const JEJUNUM_PATH = 'M-30,30 C-58,30 -60,46 -34,46 C-12,46 -10,60 -32,60';
export const ILEUM_PATH = 'M-32,60 C-58,60 -60,76 -34,76 C-14,76 -12,88 -32,88';

export interface IntestineParams {
  /** 0-1 peristaltic drive, drawn as how strongly the wall is washed. */
  motility?: number;
  colorToken?: string;
}

export function smallIntestineScene(placement: OrganPlacement, params: IntestineParams = {}): OrganDrawing {
  const token = params.colorToken ?? 'secretin';
  const wash = 0.2 + clamp01(params.motility ?? 0.5) * 0.4;

  /* Each segment is occluded before it is drawn.
   *
   * This was the one builder of the seven with no underlay, and a run of bowel is exactly where
   * that shows: `tubeNodes` paints a panel lumen, but only as wide as the INNER stroke, so the
   * wall itself stayed translucent and whatever the diagram had drawn behind the bowel — a duct,
   * the pancreas, the next coil of the same intestine — read straight through it. The organs
   * with a fill get this from `opaqueUnderlay`; a stroked organ needs the stroke equivalent.
   *
   * The calibre taper is the anatomy the drawing does carry: duodenum widest, ileum narrowest,
   * which is the order they are in and the order they lose it in disease. */
  const occlude = (d: string, width: number): PathNode => ({
    type: 'path',
    d,
    fill: 'none',
    colorToken: 'panel',
    strokeWidth: width,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  });

  const segment = (d: string, width: number): PathNode[] => [occlude(d, width), ...tubeNodes(d, token, width, wash)];

  const node = placed(placement, undefined, [
    ...segment(ILEUM_PATH, 12),
    ...segment(JEJUNUM_PATH, 14),
    ...segment(DUODENUM_PATH, 16),
  ]);

  return { node, defs: [] };
}

/* --- Pancreas ------------------------------------------------------- */
/*
 * Head in the duodenal C, uncinate process hooking behind it, body crossing the midline, tail
 * reaching the splenic hilum, with the main duct running the length. The islets are drawn along
 * the body and tail, which is where most of them are.
 *
 * Natural size: about 108 wide by 52 tall, head at the image left.
 */

/** Head, body and tail as one gland, because that is how it looks and how it drains.
 * Named for the whole organ, against the legacy `PANCREAS_PATH` above it, which is the single
 * leaf-shaped blob three module presentations still import. */
export const PANCREAS_GLAND_PATH =
  'M-8,-20 C6,-21 18,-12 19,-2 C34,-7 54,-13 70,-17 C78,-19 82,-13 80,-7 C78,-1 68,2 56,5 C42,9 28,13 19,15 C17,24 6,29 -6,27 C-18,25 -24,15 -23,4 C-22,-8 -17,-19 -8,-20 Z';
/** The uncinate process — the hook that tucks behind the superior mesenteric vessels. */
export const PANCREAS_UNCINATE_PATH = 'M-6,24 C-14,31 -25,30 -27,23 C-29,16 -22,12 -16,15 C-10,18 -7,20 -6,24 Z';
/** The main pancreatic duct, joining the bile duct at the ampulla in the head. */
export const PANCREATIC_DUCT_PATH = 'M-10,4 C2,4 20,0 40,-4 C56,-7 70,-10 78,-11';

/** Where the islets sit. Real islets are scattered and mostly distal, so these are too. */
const ISLET_POSITIONS = [
  { x: 28, y: -2 },
  { x: 44, y: -6 },
  { x: 58, y: -9 },
  { x: 70, y: -12 },
] as const;

export interface PancreasParams {
  /** 0-1 insulin output — the beta islets fill as it rises. */
  insulinLevel?: number;
  /** 0-1 glucagon output — the alpha islets fill as it rises. */
  glucagonLevel?: number;
  /** 0-1 bicarbonate secretion by the duct cells, drawn in the duct itself. */
  bicarbIntensity?: number;
  colorToken?: string;
  betaToken?: string;
  alphaToken?: string;
  ductToken?: string;
}

export function pancreasScene(placement: OrganPlacement, params: PancreasParams = {}): OrganDrawing {
  const token = params.colorToken ?? 'insulin';
  const beta = params.betaToken ?? 'insulin';
  const alpha = params.alphaToken ?? 'glucagon';
  const duct = params.ductToken ?? 'bicarb';
  const insulin = clamp01(params.insulinLevel ?? 0.4);
  const glucagon = clamp01(params.glucagonLevel ?? 0.3);
  const bicarb = clamp01(params.bicarbIntensity ?? 0.3);

  const node = placed(placement, undefined, [
    opaqueUnderlay(PANCREAS_UNCINATE_PATH),
    { type: 'path', d: PANCREAS_UNCINATE_PATH, fillGradientId: gradientId('pancreas', token) },
    opaqueUnderlay(PANCREAS_GLAND_PATH),
    { type: 'path', d: PANCREAS_GLAND_PATH, fillGradientId: gradientId('pancreas', token) },
    {
      type: 'path',
      d: PANCREATIC_DUCT_PATH,
      fill: 'none',
      colorToken: duct,
      strokeWidth: 2.4,
      strokeOpacity: 0.35 + bicarb * 0.6,
      strokeLinecap: 'round',
    },
    { type: 'path', d: PANCREAS_UNCINATE_PATH, fill: 'none', colorToken: token, strokeWidth: 1.8, strokeOpacity: 0.8 },
    { type: 'path', d: PANCREAS_GLAND_PATH, fill: 'none', colorToken: token, strokeWidth: 2, strokeLinejoin: 'round' },
    // Beta above the duct, alpha below it — a made-up convention, but a consistent one, and the
    // only way two hormone outputs can be told apart at this size.
    ...ISLET_POSITIONS.map(
      (islet): CircleNode => ({ type: 'circle', cx: islet.x, cy: islet.y - 4, r: 2 + insulin * 2.4, fill: beta, fillOpacity: 0.85 }),
    ),
    ...ISLET_POSITIONS.map(
      (islet): CircleNode => ({ type: 'circle', cx: islet.x - 7, cy: islet.y + 6, r: 1.6 + glucagon * 2, fill: alpha, fillOpacity: 0.85 }),
    ),
  ]);

  return { node, defs: [bodyGradient('pancreas', token, { x: -14, y: -16, r: 110 })] };
}

/* --- Liver ---------------------------------------------------------- */
/*
 * Anterior view: the right lobe filling the image left, the smaller left lobe to the image
 * right, the falciform ligament between them, and the gallbladder projecting BELOW the inferior
 * margin, which is the only reason a gallbladder is ever palpable. The porta hepatis is drawn
 * because the liver's whole physiology is a dual blood supply arriving there and bile leaving
 * by it — a plain wedge cannot say that.
 *
 * The superior border is the diaphragm's dome and the inferior border is the sharp oblique edge
 * you percuss for. Getting those two the right way round is most of what makes this read as a
 * liver rather than as an ellipse.
 *
 * Natural size: about 155 wide by 72 tall, or 115 tall with the gallbladder and the porta.
 */

export const LIVER_RIGHT_LOBE_PATH =
  'M26,-36 C4,-44 -22,-48 -44,-42 C-62,-37 -74,-27 -76,-14 C-78,-4 -73,6 -62,14 C-44,25 -18,28 4,26 C13,25 21,23 27,21 C25,4 25,-16 26,-36 Z';
/** The left lobe: smaller, thinner, and reaching further across the midline than students expect. */
export const LIVER_LEFT_LOBE_PATH =
  'M26,-36 C44,-35 62,-28 73,-20 C79,-15 79,-10 75,-7 C58,3 41,13 27,21 C25,4 25,-16 26,-36 Z';
/** The falciform ligament, which is what divides the two lobes on the surface. */
export const FALCIFORM_PATH = 'M26,-36 C25,-16 25,4 27,21';
/** Gallbladder, in its fossa and projecting past the inferior margin. */
export const GALLBLADDER_PATH =
  'M-22,10 C-12,9 -6,20 -8,32 C-10,43 -22,47 -29,40 C-35,33 -32,12 -22,10 Z';
/** Cystic duct, joining the common hepatic duct to make the common bile duct. */
export const CYSTIC_DUCT_PATH = 'M-10,24 C0,24 8,23 15,22';
/** The inferior vena cava, in its groove on the posterior surface. */
export const LIVER_IVC_PATH = 'M6,-58 C6,-50 6,-45 6,-38';

/** The portal triad at the porta hepatis: bile duct, hepatic artery, portal vein. */
const PORTA_PATHS = [
  { d: 'M16,22 C25,30 34,38 42,45', token: 'liver', width: 4 },
  { d: 'M4,25 C6,35 8,44 10,54', token: 'artery', width: 3.5 },
  { d: 'M10,24 C15,35 20,44 24,54', token: 'venous', width: 5 },
] as const;

export interface LiverParams {
  /** 0-1 synthetic and metabolic capacity, drawn as how strongly the parenchyma is washed —
   * a failing liver is a pale one. */
  functionLevel?: number;
  /** 0-1 how loaded the biliary tree is, drawn in the ducts and the gallbladder. */
  bileLoad?: number;
  colorToken?: string;
}

export function liverScene(placement: OrganPlacement, params: LiverParams = {}): OrganDrawing {
  const token = params.colorToken ?? 'liver';
  const fn = Math.max(0.15, Math.min(1, params.functionLevel ?? 1));
  const bile = clamp01(params.bileLoad ?? 0.4);

  const lobe = (d: string): PathNode[] => [
    opaqueUnderlay(d),
    { type: 'path', d, fillGradientId: gradientId('liver', token), fillOpacity: 0.2 + fn * 0.75 },
  ];

  const node = placed(placement, undefined, [
    ...tubeNodes(LIVER_IVC_PATH, 'venous', 11),
    ...PORTA_PATHS.flatMap((vessel) => tubeNodes(vessel.d, vessel.token, vessel.width)),
    ...lobe(LIVER_LEFT_LOBE_PATH),
    ...lobe(LIVER_RIGHT_LOBE_PATH),
    { type: 'path', d: FALCIFORM_PATH, fill: 'none', colorToken: token, strokeWidth: 1.6, strokeOpacity: 0.7 },
    { type: 'path', d: LIVER_RIGHT_LOBE_PATH, fill: 'none', colorToken: token, strokeWidth: 2.2, strokeLinejoin: 'round' },
    { type: 'path', d: LIVER_LEFT_LOBE_PATH, fill: 'none', colorToken: token, strokeWidth: 2.2, strokeLinejoin: 'round' },
    /* The gallbladder goes on LAST: its body is in a fossa on the liver's under-surface but its
     * fundus projects past the inferior margin, and drawing it behind hid the half that matters. */
    ...tubeNodes(CYSTIC_DUCT_PATH, token, 4, 0.3 + bile * 0.6),
    /* No underlay here on purpose: the gallbladder sits IN a fossa, so the half of it that
     * overlaps the liver should darken against the parenchyma rather than punch a hole in it.
     * With one it read as a detached oval parked below the organ. */
    { type: 'path', d: GALLBLADDER_PATH, fill: token, fillOpacity: 0.3 + bile * 0.45, colorToken: token, strokeWidth: 1.8 },
  ]);

  return { node, defs: [bodyGradient('liver', token, { x: -34, y: -36, r: 145 })] };
}

/* --- The whole tract ------------------------------------------------ */
/*
 * Oesophagus to rectum in one anterior view, for the modules whose subject is WHERE along the gut
 * something happens rather than any one organ. Laid out the way every textbook plate is: the
 * stomach up and to the image right (the patient's left), the duodenal C wrapped round where the
 * pancreatic head goes, the jejunum coiled in the upper left of the abdomen (image right) and the
 * ileum in the lower right (image left), and the colon framing the lot — caecum low on the image
 * left, the transverse colon sagging across in FRONT of the coils, the splenic flexure higher
 * than the hepatic one, as it is.
 *
 * The coils are a clean serpentine rather than a knot, as in `smallIntestineScene`: they only have
 * to read as a run of bowel, and no two people's are alike. What the drawing does commit to is
 * ORDER and CALIBRE — duodenum widest, ileum narrowest, colon wider than any of them — because
 * that is the order everything along it happens in.
 *
 * The liver and pancreas are not drawn here. They are separate organs with their own builders,
 * and a module draws them in whatever colour it needs them in; `ampulla` and `porta` in the
 * return are where their ducts and vessels meet this tract.
 *
 * Natural size: about 300 wide by 430 tall, centred on the origin.
 */

type Pt = readonly [number, number];
type Cubic = readonly [Pt, Pt, Pt];

/** A run of cubic Béziers, kept as numbers rather than as a path string so a builder can place
 * things ALONG it — folds, pips, chyme — rather than only draw it. */
interface Chain {
  start: Pt;
  curves: readonly Cubic[];
}

function chainD(chain: Chain): string {
  const f = (p: Pt) => `${p[0]},${p[1]}`;
  return `M${f(chain.start)} ${chain.curves.map(([c1, c2, p]) => `C${f(c1)} ${f(c2)} ${f(p)}`).join(' ')}`;
}

function cubicAt(p0: Pt, [c1, c2, p1]: Cubic, t: number): [number, number] {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * c1[0] + c * c2[0] + d * p1[0], a * p0[1] + b * c1[1] + c * c2[1] + d * p1[1]];
}

const SAMPLES = new WeakMap<Chain, { points: [number, number][]; lengths: number[] }>();

/** The chain sampled finely enough that walking it by length is honest at diagram scale. Cached:
 * the chains are module constants, and a tract walks each one dozens of times per frame. */
function sampleChain(chain: Chain): { points: [number, number][]; lengths: number[] } {
  const cached = SAMPLES.get(chain);
  if (cached) return cached;
  const points: [number, number][] = [[chain.start[0], chain.start[1]]];
  let from: Pt = chain.start;
  for (const curve of chain.curves) {
    for (let i = 1; i <= 24; i += 1) points.push(cubicAt(from, curve, i / 24));
    from = curve[2];
  }
  const lengths = [0];
  let run = 0;
  let prev = points[0]!;
  for (const point of points.slice(1)) {
    run += Math.hypot(point[0] - prev[0], point[1] - prev[1]);
    lengths.push(run);
    prev = point;
  }
  const sampled = { points, lengths };
  SAMPLES.set(chain, sampled);
  return sampled;
}

/** Point and unit tangent a fraction `u` (0-1) of the way along a chain, by length. */
function chainAt(chain: Chain, u: number): { p: [number, number]; t: [number, number] } {
  const { points, lengths } = sampleChain(chain);
  const total = lengths[lengths.length - 1] ?? 0;
  const target = clamp01(u) * total;
  let i = 1;
  while (i < lengths.length - 1 && (lengths[i] ?? 0) < target) i += 1;
  const l0 = lengths[i - 1] ?? 0;
  const span = (lengths[i] ?? l0) - l0 || 1;
  const k = (target - l0) / span;
  const [ax, ay] = points[i - 1] ?? points[0]!;
  const [bx, by] = points[i] ?? points[0]!;
  const len = Math.hypot(bx - ax, by - ay) || 1;
  return { p: [ax + (bx - ax) * k, ay + (by - ay) * k], t: [(bx - ax) / len, (by - ay) / len] };
}

/**
 * Many small dots as ONE path: each a near-zero stroke with round caps, `2r` wide. Chyme, residue,
 * enzyme beads — a drawing can carry dozens, and a node apiece is paid for on every frame, on
 * both platforms, and in every render the verification sweeps make.
 */
export function dotsPath(points: readonly (readonly [number, number])[], r: number, token: string, opacity = 1): PathNode[] {
  if (points.length === 0) return [];
  return [
    {
      type: 'path',
      d: points.map(([x, y]) => `M${x.toFixed(1)},${y.toFixed(1)} h0.01`).join(' '),
      fill: 'none',
      colorToken: token,
      strokeWidth: r * 2,
      strokeOpacity: opacity,
      strokeLinecap: 'round',
    },
  ];
}

/** A point in an organ's own coordinates, carried into the caller's frame by the same placement
 * `placed()` applies — so a module can hang a label or a duct on a builder's anatomy. */
export function placedPoint(placement: OrganPlacement, p: readonly [number, number]): [number, number] {
  const s = placement.scale ?? 1;
  const x = placement.flip ? -p[0] : p[0];
  return [placement.x + x * s, placement.y + p[1] * s];
}

export type GiSegment = 'oesophagus' | 'stomach' | 'duodenum' | 'jejunum' | 'ileum' | 'terminalIleum' | 'colon' | 'rectum';

/** Pylorus round the C to the duodenojejunal flexure, which sits just left of the midline. */
const GI_DUODENUM: Chain = {
  start: [12, -100],
  curves: [
    [[-4, -106], [-28, -110], [-40, -96]],
    [[-52, -82], [-52, -56], [-42, -44]],
    [[-30, -30], [0, -30], [22, -36]],
    [[34, -40], [40, -48], [40, -58]],
  ],
};
/** From the flexure, down behind the transverse colon and into the upper coils. */
const GI_JEJUNUM: Chain = {
  start: [40, -58],
  curves: [
    [[48, -44], [62, -22], [64, 0]],
    [[66, 22], [40, 26], [24, 14]],
    [[8, 2], [-26, 4], [-30, 22]],
    [[-34, 40], [-2, 46], [24, 40]],
    [[48, 34], [72, 40], [72, 60]],
    [[72, 80], [44, 84], [22, 78]],
  ],
};
const GI_ILEUM: Chain = {
  start: [22, 78],
  curves: [
    [[0, 72], [-40, 66], [-50, 84]],
    [[-60, 102], [-34, 112], [-8, 108]],
    [[18, 104], [44, 110], [42, 128]],
    [[40, 146], [8, 150], [-18, 144]],
    [[-38, 140], [-52, 132], [-64, 126]],
  ],
};
/** The last stretch into the caecum: the only home of the B12 receptor and the bile salt pump. */
const GI_TERMINAL_ILEUM: Chain = {
  start: [-64, 126],
  curves: [[[-72, 122], [-80, 120], [-92, 122]]],
};
/** Caecum up the ascending colon, across, down the descending colon and round the sigmoid. */
const GI_COLON: Chain = {
  start: [-106, 146],
  curves: [
    [[-108, 110], [-110, 40], [-110, -10]],
    [[-110, -30], [-104, -40], [-90, -38]],
    [[-50, -30], [-20, -14], [20, -16]],
    [[60, -18], [90, -40], [106, -46]],
    [[118, -50], [120, -40], [118, -20]],
    [[116, 30], [116, 90], [114, 130]],
    [[112, 160], [90, 160], [70, 164]],
    [[50, 168], [30, 170], [22, 182]],
  ],
};
const GI_RECTUM: Chain = { start: [22, 182], curves: [[[14, 190], [10, 198], [10, 214]]] };
/** The blind pouch below the ileocaecal valve, and the appendix hanging from it. */
const GI_CAECUM_PATH = 'M-92,122 C-92,138 -98,152 -108,152 C-120,152 -124,138 -122,124 C-120,112 -106,110 -96,116 Z';
const GI_APPENDIX_PATH = 'M-112,151 C-112,160 -108,168 -100,170';

/** Where the stomach goes, so the pylorus lands where the duodenum starts. */
const GI_STOMACH_PLACEMENT: OrganPlacement = { x: 60, y: -128, flip: true };

const GI_CHAINS: Record<Exclude<GiSegment, 'stomach'>, Chain> = {
  oesophagus: { start: [104, -216], curves: [[[104, -196], [102, -184], [97, -174]]] },
  duodenum: GI_DUODENUM,
  jejunum: GI_JEJUNUM,
  ileum: GI_ILEUM,
  terminalIleum: GI_TERMINAL_ILEUM,
  colon: GI_COLON,
  rectum: GI_RECTUM,
};

/** Wall calibre, widest to narrowest in the order the bowel runs. */
const GI_WIDTH: Record<Exclude<GiSegment, 'stomach'>, number> = {
  oesophagus: 9,
  duodenum: 14,
  jejunum: 13,
  ileum: 11,
  terminalIleum: 10,
  colon: 20,
  rectum: 20,
};

/** Below this, a segment is drawn as a broken wall: present in the drawing, gone as a site. */
export const GI_GHOST_BELOW = 0.25;

export interface GiTractSleeve {
  segment: GiSegment;
  token: string;
  /** Extra width beyond the wall, in natural units: how much of the class's work is done here. */
  extra: number;
  /** 0-1: how much of this site is working. */
  level: number;
}

export interface GiTractParams {
  stomachToken?: string;
  bowelToken?: string;
  colonToken?: string;
  /** 0-1 per segment; below `GI_GHOST_BELOW` the wall is drawn broken. Absent means 1. */
  segmentLevel?: Partial<Record<GiSegment, number>>;
  /** 0-1: how many circular folds the small bowel carries — the surface it absorbs across. */
  foldDensity?: number;
  /** 0-1: how strongly the colon's haustra are marked — a working colon against a failed one. */
  haustra?: number;
  /** Highlights drawn UNDER the wall, so a site glows around the bowel rather than over it. */
  sleeves?: readonly GiTractSleeve[];
  /** 0-1: how much of a meal is in the small bowel lumen. */
  chyme?: number;
  /** How far along the small bowel the meal has spread, 0-1 — faster transit, further. */
  chymeReach?: number;
  /** 0-1: unabsorbed solute arriving in the caecum. */
  colonLoad?: number;
}

export interface GiTractDrawing extends OrganDrawing {
  /** A point `u` (0-1) of the way along a segment, in the CALLER's frame. */
  at: (segment: GiSegment, u: number) => [number, number];
  /** Where the bile and pancreatic ducts open into the second part of the duodenum. */
  ampulla: [number, number];
  /** Where the ileum enters the caecum. */
  ilealValve: [number, number];
  pylorus: [number, number];
}

/** A point on the stomach's greater curvature side of the body, for labels. */
const GI_STOMACH_BODY: Pt = [-30, 0];

export function giTractScene(placement: OrganPlacement, params: GiTractParams = {}): GiTractDrawing {
  const bowel = params.bowelToken ?? 'capillary';
  const colonToken = params.colonToken ?? bowel;
  const stomachToken = params.stomachToken ?? bowel;
  const level = (segment: GiSegment) => clamp01(params.segmentLevel?.[segment] ?? 1);
  const tokenOf = (segment: GiSegment) => (segment === 'colon' || segment === 'rectum' ? colonToken : bowel);

  const stroke = (d: string, token: string, width: number, extra: Partial<PathNode> = {}): PathNode => ({
    type: 'path',
    d,
    fill: 'none',
    colorToken: token,
    strokeWidth: width,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...extra,
  });

  /* A wall: occluded first (a stroked organ's `opaqueUnderlay`), then the three-pass tube. A lost
   * segment keeps its lumen but loses its edge to a dash — still there on the drawing, gone as a
   * working site — so the difference reads by shape and not only by a paler wash. */
  const wall = (segment: Exclude<GiSegment, 'stomach'>): PathNode[] => {
    const d = chainD(GI_CHAINS[segment]);
    const width = GI_WIDTH[segment];
    const token = tokenOf(segment);
    const working = level(segment);
    if (working < GI_GHOST_BELOW) {
      return [
        stroke(d, 'panel', width),
        stroke(d, token, width, { strokeDasharray: '5 4', strokeOpacity: 0.75, strokeLinecap: 'butt' }),
        stroke(d, 'panel', Math.max(width - 2.6, 0.6)),
        stroke(d, token, Math.max(width - 2.6, 0.6), { strokeOpacity: 0.08 }),
      ];
    }
    return [stroke(d, 'panel', width), ...tubeNodes(d, token, width, 0.18 + working * 0.2)];
  };

  /* Transverse ticks across a segment, evenly by length: the circular folds of the small bowel,
   * the haustra of the colon. One path of many short strokes, not one node per tick — a tract
   * carries seventy of them and the node count is paid on every frame. */
  const ticks = (segment: Exclude<GiSegment, 'stomach'>, count: number, token: string, opacity: number, reach = 0.8): PathNode[] => {
    if (count <= 0) return [];
    const chain = GI_CHAINS[segment];
    const half = (GI_WIDTH[segment] / 2) * reach;
    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const { p, t } = chainAt(chain, (i + 0.5) / count);
      const n: [number, number] = [-t[1], t[0]];
      parts.push(`M${(p[0] - n[0] * half).toFixed(1)},${(p[1] - n[1] * half).toFixed(1)} L${(p[0] + n[0] * half).toFixed(1)},${(p[1] + n[1] * half).toFixed(1)}`);
    }
    return [{ type: 'path', d: parts.join(' '), fill: 'none', colorToken: token, strokeWidth: 1, strokeOpacity: opacity, strokeLinecap: 'round' }];
  };

  const folds = clamp01(params.foldDensity ?? 1);
  const foldTicks = (segment: 'duodenum' | 'jejunum' | 'ileum', perUnit: number) =>
    level(segment) < GI_GHOST_BELOW ? [] : ticks(segment, Math.round(perUnit * folds), bowel, 0.55);

  const haustra = clamp01(params.haustra ?? 1);

  const sleeves = (params.sleeves ?? []).flatMap((sleeve): SceneNode[] => {
    const d = sleeve.segment === 'stomach' ? null : chainD(GI_CHAINS[sleeve.segment]);
    const lost = sleeve.level < GI_GHOST_BELOW;
    const opacity = 0.22 + clamp01(sleeve.level) * 0.6;
    if (d === null) {
      // The stomach is a sac, not a tube: its sleeve is its own outline, thickened.
      return [
        placed(GI_STOMACH_PLACEMENT, undefined, [
            {
              type: 'path',
              d: STOMACH_BODY_PATH,
              fill: 'none',
              colorToken: sleeve.token,
              strokeWidth: 4 + sleeve.extra,
              strokeOpacity: opacity,
              strokeLinejoin: 'round',
              strokeDasharray: lost ? '5 4' : undefined,
            },
        ]),
      ];
    }
    const width = GI_WIDTH[sleeve.segment as Exclude<GiSegment, 'stomach'>] + 4 + sleeve.extra;
    return [stroke(d, sleeve.token, width, { strokeOpacity: opacity, strokeDasharray: lost ? '5 4' : undefined, strokeLinecap: lost ? 'butt' : 'round' })];
  });

  /* Chyme: what is left of a meal in the lumen, strung out as far along the small bowel as the
   * transit has carried it. A hurried gut spreads the same meal further and holds it for less. */
  const chyme = clamp01(params.chyme ?? 0);
  const reach = Math.max(0.1, clamp01(params.chymeReach ?? 0.5));
  const chymePoints: [number, number][] = [];
  const dotCount = chyme > 0.02 ? Math.round(3 + chyme * 11) : 0;
  for (let i = 0; i < dotCount; i += 1) {
    const u = ((i + 0.5) / dotCount) * reach * 2;
    const segment = u < 1 ? GI_JEJUNUM : GI_ILEUM;
    chymePoints.push(chainAt(segment, u < 1 ? u : u - 1).p);
  }
  const chymeDots = dotsPath(chymePoints, 2, stomachToken, 0.85);

  const colonLoad = clamp01(params.colonLoad ?? 0);
  const residueCount = colonLoad > 0.02 ? Math.round(2 + colonLoad * 8) : 0;
  const residue = dotsPath(
    Array.from({ length: residueCount }, (_, i): [number, number] => {
      const { p } = chainAt(GI_COLON, (i + 0.5) / 22);
      return [p[0] + (i % 2 ? 2.5 : -2.5), p[1]];
    }),
    2.2,
    'glucose',
    0.9,
  );

  const stomach = stomachScene(GI_STOMACH_PLACEMENT, { colorToken: stomachToken, acidIntensity: 0.25 });

  const node = placed(placement, undefined, [
    ...sleeves,
    ...wall('terminalIleum'),
    ...wall('ileum'),
    ...foldTicks('ileum', 14),
    ...wall('jejunum'),
    ...foldTicks('jejunum', 22),
    ...chymeDots,
    ...wall('duodenum'),
    ...foldTicks('duodenum', 8),
    ...wall('colon'),
    ...(level('colon') < GI_GHOST_BELOW ? [] : ticks('colon', 30, colonToken, 0.2 + haustra * 0.5, 0.9)),
    opaqueUnderlay(GI_CAECUM_PATH),
    { type: 'path', d: GI_CAECUM_PATH, fill: colonToken, fillOpacity: 0.12 + level('colon') * 0.2, colorToken: colonToken, strokeWidth: 2 },
    stroke(GI_APPENDIX_PATH, colonToken, 3.5, { strokeOpacity: 0.7 }),
    ...residue,
    ...wall('rectum'),
    stomach.node,
  ]);

  const at = (segment: GiSegment, u: number): [number, number] => {
    if (segment === 'stomach') return placedPoint(placement, placedPoint(GI_STOMACH_PLACEMENT, GI_STOMACH_BODY));
    return placedPoint(placement, chainAt(GI_CHAINS[segment], u).p);
  };

  return {
    node,
    defs: stomach.defs,
    at,
    ampulla: placedPoint(placement, [-47, -70]),
    ilealValve: placedPoint(placement, [-92, 122]),
    pylorus: placedPoint(placement, GI_DUODENUM.start),
  };
}

/* --- Bladder --------------------------------------------------------- */
/*
 * The bladder in coronal section, with its trigone, both ureteric orifices, and the two
 * sphincters in series down the urethra.
 *
 * The one thing this organ has to do that the others do not is CHANGE SIZE. A bladder is the
 * subject of micturition precisely because it fills, so the dome is computed from the volume
 * rather than fixed: a full bladder rises and its walls bulge, an empty one sits flat and thick.
 * The urine inside it is a rect clipped to the body, the way the liver's conjugated pool is.
 *
 * The two sphincters are drawn as collars rather than as colour alone, because their whole
 * teaching point is that they are in SERIES and independently controlled — one smooth and
 * autonomic at the neck, one striated and voluntary below it. A tight collar is drawn narrow and
 * dense, a relaxed one wide and pale, so the two controls have a visible correlate each.
 *
 * Natural size: about 130 wide by 150 tall, the body centred on the origin, the urethra running
 * down to y = 92.
 */

/** The dome rises and the shoulders bulge as it fills: -26 empty, -56 full. */
function bladderBodyPath(fill: number): string {
  const apex = -26 - fill * 30;
  const shoulder = -2 - fill * 10;
  return (
    `M-50,${shoulder} C-50,${apex + 18} -28,${apex} 0,${apex} ` +
    `C28,${apex} 50,${apex + 18} 50,${shoulder} ` +
    `C50,22 28,42 0,42 C-28,42 -50,22 -50,${shoulder} Z`
  );
}

export const BLADDER_TRIGONE_PATH = 'M-26,14 L26,14 L0,38 Z';
/* Steep and short, running down the posterolateral wall to the trigone's upper corners. Drawn
 * before the body so the dome occludes them: a ureter that stays fully visible over a full
 * bladder reads as an antenna rather than as a tube passing behind it. */
export const URETER_LEFT_PATH = 'M-46,-62 C-42,-34 -34,-8 -26,14';
export const URETER_RIGHT_PATH = 'M46,-62 C42,-34 34,-8 26,14';
export const URETHRA_PATH = 'M0,38 L0,92';
/** Folds on the posterior wall — the detrusor reading as muscle rather than as a balloon. */
const DETRUSOR_FOLDS = [
  'M-38,6 C-34,-6 -24,-14 -12,-16',
  'M-30,16 C-26,4 -16,-4 -4,-6',
  'M38,6 C34,-6 24,-14 12,-16',
] as const;

export interface BladderParams {
  /** 0-1 of functional capacity. Drives the dome, the wall and the urine inside it. */
  fillLevel?: number;
  /** 0-1 tone of the internal (smooth, autonomic) sphincter at the neck. */
  internalTone?: number;
  /** 0-1 tone of the external (striated, voluntary) sphincter below it. */
  externalTone?: number;
  /**
   * 0-1 detrusor tone. A contracting detrusor thickens, so this rides on top of the thinning
   * that distension causes — and it keeps that control's visible correlate, which the module's
   * own slider sweep in `controls.test.tsx` requires of every input.
   */
  detrusorTone?: number;
  colorToken?: string;
  urineToken?: string;
}

export function bladderScene(placement: OrganPlacement, params: BladderParams = {}): OrganDrawing {
  const token = params.colorToken ?? 'bladder';
  const urine = params.urineToken ?? 'urine';
  const fill = clamp01(params.fillLevel ?? 0.4);
  const internal = clamp01(params.internalTone ?? 0.8);
  const external = clamp01(params.externalTone ?? 0.8);
  const detrusor = clamp01(params.detrusorTone ?? 0.3);
  const body = bladderBodyPath(fill);

  /* The urine surface, in organ coordinates. It never reaches the dome: a bladder at capacity
   * still has wall above the fluid, and a fluid line flush with the roof reads as a solid
   * object rather than as a container with something in it. */
  const floor = 40;
  const roof = -18 - fill * 26;
  const surface = floor - (floor - roof) * fill;

  /* A tight sphincter is a narrow, dense collar and a relaxed one is wide and pale, so each
   * control changes the picture rather than only a number. */
  const collar = (cy: number, tone: number): PathNode => ({
    type: 'path',
    d: `M${-7 - (1 - tone) * 5},${cy} L${7 + (1 - tone) * 5},${cy}`,
    fill: 'none',
    colorToken: token,
    strokeWidth: 5 + tone * 4,
    strokeOpacity: 0.35 + tone * 0.6,
    strokeLinecap: 'round',
  });

  const node = placed(placement, undefined, [
    ...tubeNodes(URETER_LEFT_PATH, urine, 9),
    ...tubeNodes(URETER_RIGHT_PATH, urine, 9),
    ...tubeNodes(URETHRA_PATH, token, 10),
    opaqueUnderlay(body),
    { type: 'path', d: body, fillGradientId: gradientId('bladder', token) },
    // Clipped to the body, so the fluid takes the shape of whatever the dome is doing.
    {
      type: 'rect',
      x: -52,
      y: surface,
      width: 104,
      height: floor - surface + 2,
      fill: urine,
      fillOpacity: 0.5,
      clipPathId: gradientId('bladder-fluid', token),
    },
    /* 0.14 is LABEL_WASH from shared/presentation/types, written out rather than imported: this
     * file's only import is type-only, which is what lets `node --experimental-strip-types` load
     * it directly and dump a shape to SVG in a second. A value import would end that. */
    { type: 'path', d: BLADDER_TRIGONE_PATH, fill: token, fillOpacity: 0.18, colorToken: token, strokeWidth: 1.6, strokeOpacity: 0.85 },
    ...DETRUSOR_FOLDS.map(
      (d): PathNode => ({ type: 'path', d, fill: 'none', colorToken: token, strokeWidth: 1.2, strokeOpacity: 0.45 }),
    ),
    { type: 'circle', cx: -26, cy: 14, r: 2.6, fill: urine, fillOpacity: 0.9 },
    { type: 'circle', cx: 26, cy: 14, r: 2.6, fill: urine, fillOpacity: 0.9 },
    // The wall last, so nothing inside overdraws its edge. Thicker as the bladder empties.
    { type: 'path', d: body, fill: 'none', colorToken: token, strokeWidth: 3.4 - fill * 1.2 + detrusor * 3.2, strokeLinejoin: 'round' },
    collar(50, internal),
    collar(70, external),
  ]);

  return {
    node,
    defs: [
      bodyGradient('bladder', token, { x: -18, y: -20, r: 120 }),
      { type: 'clipPath', id: gradientId('bladder-fluid', token), children: [{ type: 'path', d: body }] },
    ],
  };
}

/* --- Skull and intracranial contents ------------------------------------ */
/*
 * The box that cannot expand, and the three things inside it.
 *
 * cerebralPerfusion is Monro-Kellie, so the drawing has to be a FIXED outer boundary with
 * variable contents: brain, blood and CSF drawn to scale against each other, plus whatever mass
 * has been added. The vault is deliberately rigid — it is the one shape in this file that must
 * not respond to any parameter.
 *
 * Natural size: about 170 wide by 160 tall, centred on the origin.
 */
export const SKULL_VAULT_PATH =
  'M-76,10 C-76,-44 -40,-74 0,-74 C40,-74 76,-44 76,10 C76,44 54,70 0,70 C-54,70 -76,44 -76,10 Z';
export const SKULL_INNER_PATH =
  'M-66,10 C-66,-38 -34,-64 0,-64 C34,-64 66,-38 66,10 C66,38 46,60 0,60 C-46,60 -66,38 -66,10 Z';

export interface SkullParams {
  /** Fractions of the vault, each 0-1. They are drawn as stacked bands in this order. */
  brainFraction?: number;
  bloodFraction?: number;
  csfFraction?: number;
  massFraction?: number;
}

export function skullScene(placement: OrganPlacement, params: SkullParams = {}): OrganDrawing {
  const brain = clamp01(params.brainFraction ?? 0.8);
  const blood = clamp01(params.bloodFraction ?? 0.1);
  const csf = clamp01(params.csfFraction ?? 0.1);
  const mass = clamp01(params.massFraction ?? 0);

  /* Columns across the vault, not bands up it, each clipped to the inner table — so the four
   * compartments always add up to exactly the same box however they are divided, and the
   * proportions are read the way a stacked bar is read. Vertical stacking was the first
   * version and it read as fluid levels, which is the one thing intracranial contents are not. */
  const left = -70;
  const width = 140;
  const bands: { token: string; fraction: number }[] = [
    { token: 'nerve', fraction: brain },
    { token: 'artery', fraction: blood },
    { token: 'o2', fraction: csf },
    /* Not `danger`: `artery` is already the blood column and the two reds were
     * indistinguishable in the one state where telling them apart is the point. */
    { token: 'raas', fraction: mass },
  ];
  let cursor = left;
  const drawn: PathNode[] = [];
  for (const band of bands) {
    const w = width * band.fraction;
    if (w <= 0.4) continue;
    drawn.push({
      type: 'path',
      d: `M${cursor},-70 L${cursor + w},-70 L${cursor + w},70 L${cursor},70 Z`,
      fill: band.token,
      fillOpacity: 0.42,
      clipPathId: gradientId('skull-inner', 'vault'),
    });
    cursor += w;
  }

  const node = placed(placement, undefined, [
    opaqueUnderlay(SKULL_VAULT_PATH),
    { type: 'path', d: SKULL_VAULT_PATH, fill: 'bone', fillOpacity: 0.4 },
    { type: 'path', d: SKULL_INNER_PATH, fill: 'panel' },
    ...drawn,
    { type: 'path', d: SKULL_INNER_PATH, fill: 'none', colorToken: 'bone', strokeWidth: 1.4, strokeOpacity: 0.7 },
    { type: 'path', d: SKULL_VAULT_PATH, fill: 'none', colorToken: 'bone', strokeWidth: 3, strokeLinejoin: 'round' },
  ]);

  return {
    node,
    defs: [{ type: 'clipPath', id: gradientId('skull-inner', 'vault'), children: [{ type: 'path', d: SKULL_INNER_PATH }] }],
  };
}
