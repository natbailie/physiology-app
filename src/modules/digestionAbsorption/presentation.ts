import { clamp } from '@/shared/lib/math';
import { giTractScene, liverScene, pancreasScene, type GiSegment, type GiTractSleeve } from '@/shared/diagram/organShapes';
import { villusScene, type VillusRoute } from '@/shared/diagram/tissueShapes';
import { BILE, MICRONUTRIENT, WATER } from './engine/constants';
import {
  ABSORPTION_SITES,
  GUT_SEGMENTS,
  NUTRIENT_ORDER,
  SITE_LOST_BELOW,
  siteFunction,
  smallBowelSecreting,
  type GutSegment,
  type NutrientClass,
} from './engine/absorptionSites';
import type { DigestionDerived, DigestionHistoryPoint, DigestionInputs, DigestionInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

type Ctx = PresentationContext<DigestionInternalState, DigestionDerived, DigestionInputs, DigestionHistoryPoint>;

/** Every lens the picker offers: the whole map, or one class traced along it. */
export type AbsorptionLens = 'all' | NutrientClass;

interface NutrientFacts {
  /** The picker's name for it. */
  label: string;
  /** The name on the map, short enough to sit several to a line beside a segment. */
  short: string;
  token: string;
  /** Where it goes, in one line under the tract. */
  summary: string;
  /** The carrier that takes it into the enterocyte, and the one that lets it out. */
  apical: string;
  basolateral: string;
  via: VillusRoute['via'];
}

/**
 * One colour per class, and only ever one on screen at a time: the lens shows a single class, and
 * the whole-map view writes names rather than colours, so the tract never carries more than one
 * signal colour on top of its own anatomy.
 */
const NUTRIENTS: Record<NutrientClass, NutrientFacts> = {
  carbohydrate: { label: 'Carbohydrate', short: 'sugars', token: 'glucose', summary: 'duodenum and jejunum, as monosaccharides', apical: 'SGLT1 · GLUT5', basolateral: 'GLUT2', via: 'capillary' },
  protein: { label: 'Protein', short: 'amino acids', token: 'secretin', summary: 'duodenum and jejunum, as di- and tripeptides', apical: 'PepT1', basolateral: 'amino acid carriers', via: 'capillary' },
  fat: { label: 'Fat', short: 'fat', token: 'lymph', summary: 'jejunum, from micelles, out by the lacteal', apical: 'micelle uptake', basolateral: 'chylomicrons out', via: 'lacteal' },
  ironCalciumFolate: { label: 'Iron, calcium, folate', short: 'Fe Ca folate', token: 'iron', summary: 'duodenum and proximal jejunum', apical: 'DMT1 · TRPV6 · PCFT', basolateral: 'ferroportin', via: 'capillary' },
  b12: { label: 'Vitamin B12', short: 'B12', token: 'b12', summary: 'terminal ileum only, bound to intrinsic factor', apical: 'cubilin–IF', basolateral: 'transcobalamin', via: 'capillary' },
  bileSalts: { label: 'Bile salts', short: 'bile salts', token: 'liver', summary: 'terminal ileum, and back to the liver', apical: 'ASBT', basolateral: 'OSTα/β', via: 'capillary' },
  waterSodium: { label: 'Water and sodium', short: 'water', token: 'tubule', summary: 'jejunum and ileum; the colon salvages the rest', apical: 'NHE3 · SGLT1', basolateral: 'Na⁺/K⁺-ATPase', via: 'capillary' },
  scfa: { label: 'Short-chain fatty acids', short: 'SCFA', token: 'scfa', summary: 'colon only, where bacteria make them from fibre', apical: 'MCT1', basolateral: 'butyrate burned as fuel', via: 'colonocyte' },
  alcohol: { label: 'Alcohol', short: 'alcohol', token: 'somatostatin', summary: 'stomach and proximal small bowel, by diffusion', apical: 'diffusion', basolateral: 'diffusion', via: 'capillary' },
};

/** How the engine's six sites map onto the drawing's segments. */
const SEGMENT_OF: Record<GutSegment, GiSegment> = {
  stomach: 'stomach',
  duodenum: 'duodenum',
  jejunum: 'jejunum',
  ileum: 'ileum',
  terminalIleum: 'terminalIleum',
  colon: 'colon',
};

export interface AbsorptionBand {
  nutrient: NutrientClass;
  segment: GutSegment;
  /** Usual share of the class's uptake done here, 0-1. */
  share: number;
  /** How much of this site is working, 0-1. */
  level: number;
  lost: boolean;
  /** Drawn in the lens colour, rather than as one name among several. */
  emphasised: boolean;
}

/** Every site of every class, marked with what disease has left of it — the drawing's data, and
 * the thing the tests hold rather than the markup. */
export function absorptionBands(inputs: DigestionInputs, derived: DigestionDerived, lens: AbsorptionLens): AbsorptionBand[] {
  const out: AbsorptionBand[] = [];
  for (const nutrient of NUTRIENT_ORDER) {
    for (const segment of GUT_SEGMENTS) {
      const share = ABSORPTION_SITES[nutrient][segment] ?? 0;
      if (share <= 0) continue;
      const level = siteFunction(nutrient, segment, inputs, derived);
      out.push({ nutrient, segment, share, level, lost: level < SITE_LOST_BELOW, emphasised: lens === nutrient });
    }
  }
  return out;
}

/* --- Layout -------------------------------------------------------- */

const TRACT = { x: 240, y: 262, scale: 0.85 };
const LIVER = { x: 170, y: 118, scale: 0.78 };
const PANCREAS = { x: 221, y: 199, scale: 0.78 };

/** Margin columns: names to the image left end here, names to the image right start here. */
const LEFT_EDGE = 104;
const RIGHT_EDGE = 376;
const COLUMN_WIDTH = 100;
/** `pathLabel` is 9-unit mono; this is its advance, for wrapping names into a column. */
const CHIP_ADVANCE = 5.4;
const CHIP_GAP = 6;
const CHIP_LINE = 11;

/** In the whole-map view a segment lists only the classes it does a real share of. */
const LIST_SHARE = 0.15;

interface SegmentLabel {
  segment: GutSegment;
  text: string;
  side: 'left' | 'right';
  y: number;
  /** Where along the segment the leader lands. */
  u: number;
}

const SEGMENT_LABELS: readonly SegmentLabel[] = [
  { segment: 'stomach', text: 'Stomach', side: 'right', y: 128, u: 0.5 },
  { segment: 'duodenum', text: 'Duodenum', side: 'left', y: 188, u: 0.36 },
  { segment: 'jejunum', text: 'Jejunum', side: 'right', y: 236, u: 0.36 },
  { segment: 'ileum', text: 'Ileum', side: 'left', y: 290, u: 0.3 },
  { segment: 'colon', text: 'Colon', side: 'right', y: 330, u: 0.64 },
  { segment: 'terminalIleum', text: 'Terminal ileum', side: 'left', y: 346, u: 0.5 },
];

function leader(side: 'left' | 'right', y: number, target: readonly [number, number]): SceneNode {
  const x = side === 'left' ? LEFT_EDGE + 4 : RIGHT_EDGE - 4;
  return { type: 'path', d: `M${x},${y - 4} L${target[0].toFixed(1)},${target[1].toFixed(1)}`, cls: 'leader' };
}

function name(side: 'left' | 'right', y: number, text: string): SceneNode {
  return { type: 'text', x: side === 'left' ? LEFT_EDGE : RIGHT_EDGE, y, text, cls: 'anatomy', anchor: side === 'left' ? 'end' : 'start' };
}

interface Chip {
  text: string;
  /** 0-1 opacity carrier: how much of the site is working. */
  level: number;
  lost: boolean;
  token?: string;
}

/**
 * The names of what a segment absorbs, wrapped into its margin column. A reduced site is fainter;
 * a lost one is struck through as well, so the difference survives a reader who cannot see the
 * fade — and a screenshot in greyscale.
 */
function chipLines(side: 'left' | 'right', y: number, chips: readonly Chip[]): SceneNode[] {
  const lines: Chip[][] = [];
  let line: Chip[] = [];
  let width = 0;
  for (const chip of chips) {
    const w = chip.text.length * CHIP_ADVANCE;
    if (line.length > 0 && width + CHIP_GAP + w > COLUMN_WIDTH) {
      lines.push(line);
      line = [];
      width = 0;
    }
    width += (line.length > 0 ? CHIP_GAP : 0) + w;
    line.push(chip);
  }
  if (line.length > 0) lines.push(line);

  const out: SceneNode[] = [];
  lines.forEach((row, i) => {
    const rowWidth = row.reduce((sum, chip, k) => sum + chip.text.length * CHIP_ADVANCE + (k > 0 ? CHIP_GAP : 0), 0);
    let x = side === 'left' ? LEFT_EDGE - rowWidth : RIGHT_EDGE;
    const baseline = y + CHIP_LINE * (i + 1) + 1;
    for (const chip of row) {
      const w = chip.text.length * CHIP_ADVANCE;
      out.push({
        type: 'text',
        x: Number(x.toFixed(1)),
        y: baseline,
        text: chip.text,
        cls: 'pathLabel',
        colorToken: chip.token,
        opacity: chip.lost ? 0.45 : Number((0.5 + 0.5 * chip.level).toFixed(2)),
      });
      if (chip.lost) {
        out.push({
          type: 'path',
          d: `M${x.toFixed(1)},${baseline - 3} h${w.toFixed(1)}`,
          fill: 'none',
          colorToken: chip.token ?? 'text-dim',
          strokeWidth: 1,
        });
      }
      x += w + CHIP_GAP;
    }
  });
  return out;
}

function percent(level: number): string {
  return `${Math.round(clamp(level, 0, 1) * 100)}%`;
}

export function buildDigestionAbsorptionPresentation(ctx: Ctx): ModulePresentation<DigestionInternalState, DigestionDerived, DigestionInputs, DigestionHistoryPoint> {
  const { derived, inputs } = ctx;
  const lens: AbsorptionLens = (NUTRIENT_ORDER as readonly string[]).includes(ctx.lens ?? '') ? (ctx.lens as NutrientClass) : 'all';
  const picked = lens === 'all' ? null : NUTRIENTS[lens];
  const bands = absorptionBands(inputs, derived, lens);

  const fatToken = derived.faecalFatGPerDay >= 14 ? 'danger' : 'o2';
  const stoolToken = derived.stoolWaterMlPerDay >= WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY ? 'danger' : 'text';
  const b12Token = derived.b12Deficient ? 'danger' : 'marrow';
  const ironToken = derived.ironDeficient ? 'danger' : 'iron';
  const nutritionToken = derived.nutritionIndex < 0.8 ? 'danger' : 'text';
  const alarm = derived.stoolWaterMlPerDay >= WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY
    ? // The volume, not the kind: "osmotic diarrhoea" here would print the answer to the pattern
      // question the verdict line is withheld for.
      `diarrhoea — ${derived.stoolWaterMlPerDay.toFixed(0)} ml/day${derived.stoolOsmoticGapHigh ? ' · osmotic gap high' : ''}`
    : null;

  /* --- The tract ---------------------------------------------------- */

  const load = clamp(derived.luminalMealLoad, 0, 1);
  const surface = clamp(inputs.mucosalSurfaceAreaPct / 100, 0, 1);
  const terminalIleum = clamp(inputs.terminalIlealFunctionPct / 100, 0, 1);
  const colon = clamp(inputs.colonicFunctionPct / 100, 0, 1);
  const bileLoad = clamp(derived.bileSaltPoolG / BILE.POOL_REF_G, 0, 1);

  const sleeves: GiTractSleeve[] = picked
    ? bands
        .filter((band) => band.emphasised)
        .map((band) => ({ segment: SEGMENT_OF[band.segment], token: picked.token, extra: 2 + band.share * 10, level: band.level }))
    : [];

  const tract = giTractScene(TRACT, {
    stomachToken: 'gastrin',
    bowelToken: 'capillary',
    // A resected terminal ileum or a failed colon is drawn broken; a flattened mucosa is not —
    // it is still bowel, it has lost its folds, and the folds are what the surface slider moves.
    segmentLevel: { terminalIleum, colon },
    foldDensity: surface,
    haustra: colon,
    sleeves,
    chyme: load,
    // A hurried gut strings the same meal further along before it is absorbed.
    chymeReach: clamp(0.35 * inputs.transitMultiplier, 0.15, 1),
    colonLoad: clamp(derived.unabsorbedLactoseGPerDay / 20, 0, 1),
  });
  const liver = liverScene(LIVER, { functionLevel: clamp(inputs.hepaticSynthesisCapacityPct / 100, 0, 1), bileLoad });
  const pancreas = pancreasScene(PANCREAS, {
    // Exocrine only here: the islets stay small and constant, and the DUCT carries the enzymes,
    // drawn from the raw capacity because `enzymeFactor` saturates at a tenth of normal.
    insulinLevel: 0.15,
    glucagonLevel: 0.15,
    bicarbIntensity: clamp(inputs.pancreaticEnzymeCapacityPct / 100, 0, 1),
    colorToken: 'cck',
    betaToken: 'cck',
    alphaToken: 'cck',
    ductToken: 'cck',
  });

  const [ax, ay] = tract.ampulla;
  /** The common bile duct, from the porta down behind the duodenum to the ampulla. */
  const bileDuct = `M202.8,153 C207,170 206,188 ${ax.toFixed(1)},${ay.toFixed(1)}`;
  /** The pancreatic duct's last few millimetres, meeting it there. */
  const pancreaticDuct = `M213,202 L${(ax + 2).toFixed(1)},${ay.toFixed(1)}`;
  const [tx, ty] = tract.at('terminalIleum', 0.2);
  /** Portal return from the terminal ileum to the liver, routed outside the colon so it can be
   * followed: what the ileum reclaims — the bile salts above all — goes back this way. */
  const portal = `M${tx.toFixed(1)},${ty.toFixed(1)} C150,${ty.toFixed(1)} 126,${(ty - 6).toFixed(1)} 126,${(ty - 40).toFixed(1)} L126,176 C126,156 134,146 148,138`;

  const segmentNodes = SEGMENT_LABELS.flatMap((label): SceneNode[] => {
    const target = tract.at(SEGMENT_OF[label.segment], label.u);
    const here = bands.filter((band) => band.segment === label.segment);
    const chips: Chip[] = picked
      ? here
          .filter((band) => band.emphasised)
          .map((band) => ({
            text: `${picked.short} ${percent(band.level)}`,
            level: band.level,
            lost: band.lost,
            token: picked.token,
          }))
      : here
          .filter((band) => band.share >= LIST_SHARE)
          .sort((a, b) => b.share - a.share)
          .map((band) => ({
            text:
              band.nutrient === 'waterSodium' && band.segment !== 'colon' && smallBowelSecreting(inputs)
                ? 'water out'
                : NUTRIENTS[band.nutrient].short,
            level: band.level,
            lost: band.lost,
          }));
    return [leader(label.side, label.y, target), name(label.side, label.y, label.text), ...chipLines(label.side, label.y, chips)];
  });

  const organNames: SceneNode[] = [
    leader('left', 96, [138, 98]),
    name('left', 96, 'Liver'),
    leader('left', 146, [154, 141]),
    name('left', 146, 'Gallbladder'),
    leader('left', 258, [126, 262]),
    name('left', 258, 'Portal vein'),
    leader('left', 396, tract.at('colon', 0.02)),
    name('left', 396, 'Caecum'),
    leader('right', 86, tract.at('oesophagus', 0.4)),
    name('right', 86, 'Oesophagus'),
    leader('right', 196, [276, 191]),
    name('right', 196, 'Pancreas'),
  ];

  /* What the meal IS: fat and lactose, the two things this module's chain has to handle. */
  const meal: SceneNode[] = [
    { type: 'text', x: 16, y: 22, text: 'Meal', cls: 'caption' },
    { type: 'path', d: 'M16,34 h72', colorToken: 'text-faint', strokeWidth: 7, strokeLinecap: 'butt', fill: 'none', opacity: 0.25 },
    { type: 'path', d: `M16,34 h${(clamp(derived.mealFatGrams / 80, 0, 1) * 72).toFixed(1)}`, colorToken: 'lymph', strokeWidth: 7, strokeLinecap: 'butt', fill: 'none' },
    { type: 'text', x: 94, y: 37, text: `fat ${derived.mealFatGrams.toFixed(0)} g`, cls: 'caption' },
    { type: 'path', d: 'M16,50 h72', colorToken: 'text-faint', strokeWidth: 7, strokeLinecap: 'butt', fill: 'none', opacity: 0.25 },
    { type: 'path', d: `M16,50 h${(clamp(derived.mealLactoseGrams / 50, 0, 1) * 72).toFixed(1)}`, colorToken: 'glucose', strokeWidth: 7, strokeLinecap: 'butt', fill: 'none' },
    { type: 'text', x: 94, y: 53, text: `lactose ${derived.mealLactoseGrams.toFixed(0)} g`, cls: 'caption' },
  ];

  /* The stool, beside the rectum it leaves by. */
  const STOOL = { x: 292, y: 452, width: 160 };
  const stoolFill = (clamp(derived.stoolWaterMlPerDay, 0, 3000) / 3000) * STOOL.width;
  const thresholdX = STOOL.x + (WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY / 3000) * STOOL.width;
  const stool: SceneNode[] = [
    { type: 'text', x: STOOL.x, y: STOOL.y - 10, text: 'Stool water', cls: 'caption' },
    { type: 'path', d: `M${STOOL.x},${STOOL.y} h${STOOL.width}`, colorToken: 'text-faint', strokeWidth: 7, strokeLinecap: 'butt', fill: 'none', opacity: 0.25 },
    { type: 'path', d: `M${STOOL.x},${STOOL.y} h${Math.max(stoolFill, 1).toFixed(1)}`, colorToken: stoolToken === 'danger' ? 'danger' : 'text-dim', strokeWidth: 7, strokeLinecap: 'butt', fill: 'none' },
    { type: 'line', x1: thresholdX, x2: thresholdX, y1: STOOL.y - 7, y2: STOOL.y + 7, cls: 'axis' },
    { type: 'text', x: STOOL.x, y: STOOL.y + 18, text: `${derived.stoolWaterMlPerDay.toFixed(0)} ml/day · line at 200`, cls: 'caption' },
  ];

  const key: SceneNode[] = picked
    ? [
        { type: 'text', x: 16, y: 484, text: `${picked.label}: ${picked.summary}`, cls: 'caption', colorToken: picked.token },
        { type: 'text', x: 16, y: 498, text: 'band width = usual share · dashed = site lost', cls: 'caption' },
      ]
    : [
        { type: 'text', x: 16, y: 484, text: 'Beside each segment: what it absorbs', cls: 'caption' },
        { type: 'text', x: 16, y: 498, text: 'faded = reduced · struck through = site lost', cls: 'caption' },
      ];

  const tractFrame = {
    type: 'frame' as const,
    key: 'da-tract',
    viewBox: [0, 0, 480, 548] as [number, number, number, number],
    ariaLabel: picked
      ? `The gut from oesophagus to rectum, with ${picked.label.toLowerCase()} traced along the segments that absorb it: ${picked.summary}. Bands narrow or break where disease has taken the site away.`
      : 'The gut from oesophagus to rectum, with the liver, gallbladder and pancreas, and beside each segment the nutrients it absorbs — faded where that site is reduced and struck through where it is lost.',
    defs: [...pancreas.defs, ...tract.defs, ...liver.defs],
    children: [
      ...meal,
      pancreas.node,
      tract.node,
      liver.node,
      { type: 'path', d: bileDuct, fill: 'none', colorToken: 'liver', strokeWidth: 3, strokeOpacity: 0.35 + bileLoad * 0.6, strokeLinecap: 'round' },
      { type: 'path', d: pancreaticDuct, fill: 'none', colorToken: 'cck', strokeWidth: 2.4, strokeOpacity: 0.35 + clamp(inputs.pancreaticEnzymeCapacityPct / 100, 0, 1) * 0.6 },
      {
        type: 'vessel',
        path: portal,
        colorToken: 'venous',
        speed: 0.2 + inputs.ilealReabsorptionFraction * 0.8,
        width: 0.5 + inputs.ilealReabsorptionFraction,
      },
      ...organNames,
      ...segmentNodes,
      ...stool,
      ...key,
      ...(alarm ? [{ type: 'text' as const, x: 16, y: 518, text: alarm, cls: 'alarm' }] : []),
      { type: 'text', x: 16, y: 540, text: derived.classification, cls: 'verdict' },
    ] as SceneNode[],
  };

  /* --- The villus --------------------------------------------------- */

  const ileal = lens === 'b12' || lens === 'bileSalts';
  const colonic = lens === 'scfa';
  const region = colonic ? 'Colonic crypts' : ileal ? 'Terminal ileal villus' : 'Jejunal villus';
  const VILLUS = { x: 100, y: 40, scale: 0.9 };
  const fatUptake = clamp(derived.currentMealFatAbsorptionPct / 100, 0, 1);
  const eating = 0.35 + 0.65 * load;
  const villus = villusScene(VILLUS, {
    // Surface only: a resected terminal ileum is GONE, not flattened, and the tract above already
    // draws it broken. Flattening this villus as well would say atrophy where the lesion is a cut.
    villusHeight: surface,
    brushBorderEnzyme: clamp(inputs.lactaseActivityPct / 100, 0, 1),
    cryptSecretion: clamp(inputs.secretoryDrivePct / 100, 0, 1),
    capillaryLoad: clamp(derived.generalUptakeFraction * eating, 0, 1),
    lactealLoad: clamp((derived.mealFatGrams / 80) * fatUptake * eating * 1.4, 0, 1),
    route: picked ? { token: picked.token, via: picked.via } : undefined,
    flat: colonic,
    colorToken: 'capillary',
  });

  const villusLabels: Array<[string, [number, number]]> = [
    ['Brush border', villus.brushBorder],
    [colonic ? 'Colonocyte' : 'Enterocyte', villus.enterocyte],
    ['Goblet cell', villus.goblet],
    ['Capillary', villus.capillary],
    ...(colonic ? [] : ([['Lacteal', villus.lacteal]] as Array<[string, [number, number]]>)),
    ['Crypt', villus.crypt],
  ];
  const villusNames = villusLabels.flatMap(([text, target], i): SceneNode[] => {
    const y = 60 + i * 30;
    return [
      { type: 'path', d: `M88,${y - 4} L${target[0].toFixed(1)},${target[1].toFixed(1)}`, cls: 'leader' },
      { type: 'text', x: 84, y, text, cls: 'anatomy', anchor: 'end' },
    ];
  });

  /* The enterocyte close up: in at the brush border, out at the base, into the vessel that carries
   * it away. Anchored by a leader to the cell it enlarges — an inset with no anchor would be a
   * second picture, not a closer look at this one. */
  const CELL = { x: 352, y: 84, w: 96, h: 84 };
  const apicalX = CELL.x + 30;
  const baseX = CELL.x + CELL.w - 26;
  const exitY = CELL.y + CELL.h + 26;
  const cellToken = 'capillary';
  const routes: Array<{ token: string; via: VillusRoute['via']; apical: string; basolateral: string; dx: number }> = picked
    ? [{ token: picked.token, via: picked.via, apical: picked.apical, basolateral: picked.basolateral, dx: 0 }]
    : [
        { token: 'text-dim', via: 'capillary', apical: 'water-soluble', basolateral: 'to capillary', dx: -12 },
        { token: 'lymph', via: 'lacteal', apical: 'fat', basolateral: 'to lacteal', dx: 14 },
      ];
  const insetMarkers = routes.map((route) => ({ type: 'marker' as const, id: `inset-${route.token}`, colorToken: route.token }));
  const inset: SceneNode[] = [
    { type: 'path', d: `M${CELL.x},${CELL.y + 30} L${villus.inset[0].toFixed(1)},${villus.inset[1].toFixed(1)}`, cls: 'leader' },
    // Right-aligned to the cell: set from its left edge, "Enterocyte, close up" ran off the frame.
    { type: 'text', x: CELL.x + CELL.w, y: 36, text: colonic ? 'Colonocyte, close up' : 'Enterocyte, close up', cls: 'caption', anchor: 'end' },
    { type: 'rect', x: CELL.x, y: CELL.y, width: CELL.w, height: CELL.h, fill: cellToken, fillOpacity: 0.14, stroke: cellToken, strokeWidth: 1.4 },
    {
      type: 'path',
      d: Array.from({ length: 16 }, (_, i) => `M${CELL.x + 3 + i * 6},${CELL.y} v-7`).join(' '),
      fill: 'none',
      colorToken: cellToken,
      strokeWidth: 1.2,
      strokeOpacity: 0.7,
    },
    ...routes.flatMap((route): SceneNode[] => {
      const inX = apicalX + route.dx;
      const outX = baseX + route.dx;
      const exitToken = route.via === 'lacteal' ? 'lymph' : 'venous';
      return [
        {
          type: 'path',
          d: `M${inX},${CELL.y - 22} L${inX},${CELL.y} C${inX},${CELL.y + 44} ${outX},${CELL.y + 40} ${outX},${CELL.y + CELL.h} L${outX},${exitY - 6}`,
          fill: 'none',
          colorToken: route.token,
          strokeWidth: 1.5,
          markerEnd: `inset-${route.token}`,
        },
        { type: 'circle', cx: inX, cy: CELL.y, r: 4, fill: route.token, stroke: route.token, strokeWidth: 1 },
        { type: 'circle', cx: outX, cy: CELL.y + CELL.h, r: 4, fill: route.token, stroke: route.token, strokeWidth: 1 },
        { type: 'path', d: `M${outX - 10},${exitY} h20`, fill: 'none', colorToken: exitToken, strokeWidth: 5, strokeOpacity: 0.5, strokeLinecap: 'round' },
      ];
    }),
    ...(picked
      ? [
          { type: 'text' as const, x: CELL.x + CELL.w, y: CELL.y - 26, text: picked.apical, cls: 'pathLabel', anchor: 'end' as const },
          { type: 'text' as const, x: CELL.x + CELL.w, y: exitY + 16, text: picked.basolateral, cls: 'pathLabel', anchor: 'end' as const },
          {
            type: 'text' as const,
            x: CELL.x + CELL.w,
            y: exitY + 28,
            text: picked.via === 'lacteal' ? 'to lacteal, then thoracic duct' : 'to portal vein, then liver',
            cls: 'pathLabel',
            anchor: 'end' as const,
          },
        ]
      : [
          { type: 'text' as const, x: CELL.x + CELL.w, y: CELL.y - 26, text: 'water-soluble · fat', cls: 'pathLabel', anchor: 'end' as const },
          { type: 'text' as const, x: CELL.x + CELL.w, y: exitY + 16, text: 'capillary → portal vein', cls: 'pathLabel', anchor: 'end' as const },
          { type: 'text' as const, x: CELL.x + CELL.w, y: exitY + 28, text: 'lacteal → thoracic duct', cls: 'pathLabel', anchor: 'end' as const },
        ]),
  ];

  const villusFrame = {
    type: 'frame' as const,
    key: 'da-villus',
    viewBox: [0, 0, 480, 268] as [number, number, number, number],
    ariaLabel: `${region}, drawn schematically: enterocytes with a brush border, a goblet cell, a capillary loop${colonic ? '' : ' and a central lacteal'}, and the crypts between. Villus height follows the working surface, beads on the brush border follow lactase, and arrows out of the crypts follow the secretory drive.${picked ? ` The route ${picked.label.toLowerCase()} takes is traced through the cell.` : ''}`,
    defs: [...villus.defs, ...insetMarkers],
    children: [
      { type: 'text', x: 16, y: 24, text: region, cls: 'anatomyStrong' },
      villus.node,
      ...villusNames,
      ...inset,
      {
        type: 'text',
        x: 16,
        y: 258,
        text: colonic ? 'arrows = crypt secretion' : `beads = lactase ${percent(inputs.lactaseActivityPct / 100)} · arrows = crypt secretion`,
        cls: 'caption',
      },
    ] as SceneNode[],
  };

  return {
    diagram: [tractFrame, villusFrame],
    lens: {
      label: 'Highlight nutrient',
      initial: 'all',
      options: [
        { value: 'all', label: 'All' },
        ...NUTRIENT_ORDER.map((nutrient) => ({ value: nutrient, label: NUTRIENTS[nutrient].label, colorToken: NUTRIENTS[nutrient].token })),
      ],
    },
    // The capacities are already 0-100, so they carry a '%' unit and NO percent format — the format
    // multiplies by a hundred, which is right only for the one input stored as a fraction.
    controls: [
      { kind: 'slider', label: 'Fat content', key: 'mealFatGrams', min: 0, max: 80, step: 2, unit: ' g' },
      { kind: 'slider', label: 'Lactose content', key: 'mealLactoseGrams', min: 0, max: 50, step: 2, unit: ' g' },
      { kind: 'slider', label: 'Pancreatic enzymes', key: 'pancreaticEnzymeCapacityPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Liver synthesis capacity', key: 'hepaticSynthesisCapacityPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Ileal salt recycling', key: 'ilealReabsorptionFraction', min: 0, max: 1, step: 0.01, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Mucosal surface area', key: 'mucosalSurfaceAreaPct', min: 0, max: 100, step: 2, unit: '%' },
      { kind: 'slider', label: 'Terminal ileum function', key: 'terminalIlealFunctionPct', min: 0, max: 100, step: 2, unit: '%' },
      { kind: 'slider', label: 'Lactase activity', key: 'lactaseActivityPct', min: 0, max: 100, step: 2, unit: '%' },
      { kind: 'slider', label: 'Colonic function', key: 'colonicFunctionPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Secretory drive', key: 'secretoryDrivePct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Transit speed', key: 'transitMultiplier', min: 0.5, max: 3, step: 0.1, unit: 'x' },
    ],
    readouts: [
      {
        label: 'Fat uptake',
        value: (c) => c.derived.currentMealFatAbsorptionPct.toFixed(0),
        unit: '%',
        secondary: (c) => `faecal fat ${c.derived.faecalFatGPerDay.toFixed(1)} g/day`,
        colorToken: fatToken,
      },
      {
        label: 'Bile salt pool',
        value: (c) => c.derived.bileSaltPoolG.toFixed(1),
        unit: 'g',
        secondary: (c) => `liver makes ${c.derived.hepaticSynthesisGPerDay.toFixed(1)} · spills ${c.derived.spiltBileSaltsGPerDay.toFixed(1)}`,
        colorToken: 'liver',
      },
      {
        label: 'Emulsification',
        value: (c) => (c.derived.bileEmulsificationFactor * 100).toFixed(0),
        unit: '%',
        secondary: () => 'detergent for the fat',
        colorToken: 'liver',
      },
      {
        label: 'Lactose uptake',
        value: (c) => c.derived.lactoseAbsorbedPct.toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.unabsorbedLactoseGPerDay > 1 ? `${c.derived.unabsorbedLactoseGPerDay.toFixed(0)} g heading for the colon` : 'brush border coping'),
        colorToken: 'gastrin',
      },
      {
        label: 'Stool water',
        value: (c) => c.derived.stoolWaterMlPerDay.toFixed(0),
        unit: 'ml/day',
        secondary: (c) => c.derived.stoolClassification,
        colorToken: stoolToken,
      },
      {
        label: 'Osmotic gap',
        value: (c) => (c.derived.stoolOsmoticGapHigh ? 'high' : 'low'),
        secondary: (c) => (c.derived.stoolOsmoticGapHigh ? 'unabsorbed solute — stop the food' : 'electrolyte-driven or quiet'),
        colorToken: 'text',
      },
      {
        label: 'B12 store',
        value: (c) => (c.derived.b12StoreFraction * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.b12Deficient ? 'deficient — ileal site lost' : 'replete'),
        colorToken: b12Token,
      },
      {
        label: 'Iron store',
        value: (c) => (c.derived.ironStoreFraction * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.ironDeficient ? `deficient — <${MICRONUTRIENT.DEFICIENT_FRACTION * 100}%` : 'replete'),
        colorToken: ironToken,
      },
      {
        label: 'Nutrition',
        value: (c) => (c.derived.nutritionIndex * 100).toFixed(0),
        unit: '%',
        secondary: () => 'drifting toward what absorption delivers',
        colorToken: nutritionToken,
      },
      {
        label: 'State',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        revealsPattern: true,
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Stool water',
        unit: 'ml/day',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 3000,
        data: (points) => points.map((p) => p.stoolWaterMlPerDay),
      },
      {
        kind: 'sparkline',
        label: 'Bile salt pool',
        unit: 'g',
        colorToken: 'liver',
        domainMin: 0,
        domainMax: 5,
        data: (points) => points.map((p) => p.bileSaltPoolG),
      },
      {
        kind: 'sparkline',
        label: 'Fat uptake',
        unit: '%',
        colorToken: 'o2',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.fatAbsorptionPct),
      },
      {
        kind: 'sparkline',
        label: 'Nutrition',
        unit: '%',
        colorToken: 'text',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.nutritionIndex * 100),
      },
    ],
  };
}
