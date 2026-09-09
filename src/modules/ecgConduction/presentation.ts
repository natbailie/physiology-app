import { clamp } from '@/shared/lib/math';
import { heartScene, type HeartRegion } from '@/shared/diagram/organShapes';
import { LEAD_AXES, PRECORDIAL_AXES } from './engine/constants';
import { sampleBeat } from './engine/beatSample';
import type {
  EcgDerived,
  EcgHistoryPoint,
  EcgInputs,
  EcgState,
  LeadName,
  PrecordialLeadName,
  RegionActivation,
  RegionId,
  RegionState,
} from './engine/types';
import type { FrameNode, ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

/* --- Conduction-system anatomy ------------------------------------- */
/*
 * The heart is the shared `heartScene`: four chambers, the great vessels and the coronary tree,
 * in an anterior view. It was six detached Bézier blobs with no silhouette, no vessels and no
 * coronaries — a drawing that could show which region was depolarising and nothing else, on a
 * page whose whole subject is where in the heart the wavefront currently is.
 *
 * The conduction system is drawn ON TOP of it in the builder's own coordinates, where the
 * chambers span about x -42..45 and y -30..60: the AV node at the base of the interatrial
 * septum just above the AV groove, and the bundles either side of the interventricular groove,
 * which is exactly where that groove marks the septum on the surface.
 *
 * NOTE: the web page still renders `components/EcgDiagram.tsx`, because its diagram slot also
 * carries a live rolling strip and an INTERACTIVE twelve-lead grid that this schema does not
 * describe. Until it does, this builder improves the phone and the two platforms draw different
 * hearts here.
 */

/** Which of the builder's four chambers each modelled region paints. `lvBase` and `lvFreeWall`
 *  are both the left ventricle; the builder does not separate them and neither does the ECG —
 *  what it distinguishes is atrium from ventricle and left from right. */
const REGION_TO_CHAMBER: Partial<Record<RegionId, HeartRegion>> = {
  rightAtrium: 'ra',
  leftAtrium: 'la',
  rvFreeWall: 'rv',
  lvFreeWall: 'lv',
  lvBase: 'lv',
};

const CONDUCTION_PATHS: Partial<Record<RegionId, string>> = {
  // His bundle: from the AV node down through the membranous septum.
  hisBundle: 'M-1,1 L4,12',
  // Right bundle branch: a single cord down the right side of the septum to the RV free wall.
  rightBundle: 'M4,12 C0,24 -6,34 -12,44',
  // Left bundle branch: fanning over the LV septal surface, following the anterior IV groove.
  leftBundle: 'M4,12 C13,26 22,40 30,52',
};

const NODE_POSITIONS: Partial<
  Record<RegionId, { cx: number; cy: number; r: number; label: string; labelX: number; labelY: number; leader: string }>
> = {
  // High in the right atrium at the SVC junction, which is where it is and why it paces.
  saNode: { cx: -22, cy: -25, r: 3.5, label: 'SA', labelX: -50, labelY: -34, leader: 'M-46,-31 L-25,-26' },
  // At the base of the interatrial septum, just above the AV groove.
  avNode: { cx: -1, cy: 1, r: 3, label: 'AV', labelX: -52, labelY: 6, leader: 'M-48,3 L-4,1' },
};

const CHAMBER_LABELS: { x: number; y: number; text: string }[] = [
  { x: -26, y: -8, text: 'RA' },
  { x: 16, y: -14, text: 'LA' },
  { x: -22, y: 32, text: 'RV' },
  { x: 30, y: 36, text: 'LV' },
  // The interventricular groove IS the septum's surface marking, so the label sits at its foot.
  { x: 34, y: 76, text: 'Septum' },
];

/** Map a region's membrane state onto the module's two signal colours, so the depolarising
 *  sweep is visible on the heart while its wave is written on the strip. A resting region takes
 *  no override, so the builder paints it with its own body gradient. */
function regionToken(state: RegionState): string | undefined {
  switch (state) {
    case 'depolarizing':
    case 'depolarized':
      return 'depolarized';
    case 'repolarizing':
      return 'repolarizing';
    default:
      return undefined;
  }
}

/** The heart plus its conduction system, and the gradient defs the builder needs. */
function buildHeartConduction(
  regions: RegionActivation[],
  x: number,
  y: number,
): { node: SceneNode; defs: FrameNode['defs'] } {
  const byId = new Map(regions.map((region) => [region.id, region]));

  /* One token per chamber. Where two modelled regions share a chamber — the LV base and its free
   * wall — an ACTIVE one wins, so the chamber lights as soon as any part of it does. */
  const regionTokens: Partial<Record<HeartRegion, string>> = {};
  for (const [id, chamber] of Object.entries(REGION_TO_CHAMBER) as [RegionId, HeartRegion][]) {
    const token = regionToken(byId.get(id)?.state ?? 'resting');
    if (token && !regionTokens[chamber]) regionTokens[chamber] = token;
  }

  /* Scale 1: the whole assembly is scaled by the group below, so the conduction paths and the
   * chamber labels stay in the SAME coordinates as the chambers they sit on. Scaling only the
   * heart would leave the His bundle a third of the way up the atria. */
  const heart = heartScene({ x: 0, y: 0 }, { regionTokens, leftToken: 'text-faint', rightToken: 'text-faint' });

  const children: SceneNode[] = [heart.node];

  for (const [id, path] of Object.entries(CONDUCTION_PATHS) as [RegionId, string][]) {
    const active = byId.get(id)?.state === 'depolarizing';
    children.push({
      type: 'path',
      d: path,
      fill: 'none',
      colorToken: 'conduction-path',
      strokeWidth: active ? 2.5 : 2,
      strokeLinecap: 'round',
    });
  }

  for (const [, node] of Object.entries(NODE_POSITIONS) as [
    RegionId,
    NonNullable<(typeof NODE_POSITIONS)[RegionId]>,
  ][]) {
    children.push(
      { type: 'path', d: node.leader, cls: 'leader' },
      { type: 'circle', cx: node.cx, cy: node.cy, r: node.r, fill: 'conduction-path' },
      // Out to the left of the heart on a leader: the node is three units across and sits ON a
      // chamber, so a label beside it would be unreadable whatever colour it took.
      { type: 'text', x: node.labelX, y: node.labelY, text: node.label, cls: 'pathLabel', anchor: 'end' },
    );
  }

  for (const label of CHAMBER_LABELS) {
    children.push({ type: 'text', x: label.x, y: label.y, text: label.text, cls: 'organLabel', anchor: 'middle' });
  }

  return {
    node: { type: 'group', transform: `translate(${x}, ${y}) scale(1.5)`, children },
    defs: heart.defs,
  };
}

/* --- The two reference-plane insets (translated from Hexaxial/HorizontalPlaneInset) --- */

const DEG_TO_RAD = Math.PI / 180;

function pt(angleDegrees: number, length: number): { x: number; y: number } {
  return { x: Math.cos(angleDegrees * DEG_TO_RAD) * length, y: Math.sin(angleDegrees * DEG_TO_RAD) * length };
}

/** Horizontal-plane point: viewed from above, patient's left on the right, ANTERIOR at top. */
function ptHorizontal(angleDegrees: number, length: number): { x: number; y: number } {
  return { x: Math.cos(angleDegrees * DEG_TO_RAD) * length, y: -Math.sin(angleDegrees * DEG_TO_RAD) * length };
}

function ringPath(cx: number, cy: number, r: number): string {
  return `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
}

function buildHexaxial(
  derived: EcgDerived,
  x: number,
  y: number,
  radius: number,
): SceneNode {
  const children: SceneNode[] = [];
  const vectorLength = clamp(derived.dipoleMagnitude * radius * 1.6, 0, radius * 0.95);
  const tip = pt(derived.dipoleAngleDegrees, vectorLength);
  const meanTip = pt(derived.meanQrsAxisDegrees, radius * 0.72);

  children.push({
    type: 'path',
    d: ringPath(0, 0, radius),
    fill: 'none',
    colorToken: 'panel-border',
    strokeWidth: 1,
  });

  for (const [lead, angle] of Object.entries(LEAD_AXES) as [LeadName, number][]) {
    const positive = pt(angle, radius);
    const negative = pt(angle, -radius);
    const label = pt(angle, radius + 9);
    const selected = lead === derived.lead;
    if (selected) {
      children.push({
        type: 'path',
        d: `M${negative.x},${negative.y} L${positive.x},${positive.y}`,
        fill: 'none',
        colorToken: 'ecg-trace',
        strokeWidth: 2,
      });
    } else {
      children.push({
        type: 'line',
        x1: negative.x,
        y1: negative.y,
        x2: positive.x,
        y2: positive.y,
        colorToken: 'text-faint',
      });
    }
    children.push({
      type: 'text',
      x: label.x,
      y: label.y + 2,
      text: lead,
      anchor: 'middle',
      colorToken: selected ? 'ecg-trace' : undefined,
      cls: 'tickLabel',
    });
  }

  // The mean QRS axis — the steady direction the ventricles depolarise in overall.
  children.push({
    type: 'line',
    x1: 0,
    y1: 0,
    x2: meanTip.x,
    y2: meanTip.y,
    colorToken: 'text-faint',
  });

  if (vectorLength > 1) {
    children.push({
      type: 'path',
      d: `M0,0 L${tip.x},${tip.y}`,
      fill: 'none',
      colorToken: 'depolarized',
      strokeWidth: 2.5,
    });
  }
  children.push({ type: 'circle', cx: 0, cy: 0, r: 2, fill: 'text' });

  return { type: 'group', transform: `translate(${x}, ${y})`, children };
}

function buildHorizontalPlane(
  derived: EcgDerived,
  x: number,
  y: number,
  radius: number,
): SceneNode {
  const children: SceneNode[] = [];
  const vectorLength = clamp(derived.dipoleMagnitude * radius * 1.6, 0, radius * 0.95);
  const tip = ptHorizontal(derived.horizontalAngleDegrees, vectorLength);

  children.push({
    type: 'path',
    d: ringPath(0, 0, radius),
    fill: 'none',
    colorToken: 'panel-border',
    strokeWidth: 1,
  });

  for (const [lead, angle] of Object.entries(PRECORDIAL_AXES) as [PrecordialLeadName, number][]) {
    const electrode = ptHorizontal(angle, radius);
    const label = ptHorizontal(angle, radius + 10);
    const selected = lead === derived.lead;
    if (selected) {
      children.push({
        type: 'path',
        d: `M0,0 L${electrode.x},${electrode.y}`,
        fill: 'none',
        colorToken: 'ecg-trace',
        strokeWidth: 2,
      });
    } else {
      children.push({
        type: 'line',
        x1: 0,
        y1: 0,
        x2: electrode.x,
        y2: electrode.y,
        colorToken: 'text-faint',
      });
    }
    children.push({
      type: 'circle',
      cx: electrode.x,
      cy: electrode.y,
      r: selected ? 2.6 : 1.8,
      fill: selected ? 'ecg-trace' : 'text-faint',
    });
    children.push({
      type: 'text',
      x: label.x,
      y: label.y + 2,
      text: lead,
      anchor: 'middle',
      colorToken: selected ? 'ecg-trace' : undefined,
      cls: 'tickLabel',
    });
  }

  if (vectorLength > 1) {
    children.push({
      type: 'path',
      d: `M0,0 L${tip.x},${tip.y}`,
      fill: 'none',
      colorToken: 'depolarized',
      strokeWidth: 2.5,
    });
  }
  children.push({ type: 'circle', cx: 0, cy: 0, r: 2, fill: 'text' });

  return { type: 'group', transform: `translate(${x}, ${y})`, children };
}

/* --- The twelve-lead grid (translated from TwelveLeadGrid.tsx) as its own frame --- */

const GRID_LAYOUT: LeadName[] = ['I', 'aVR', 'V1', 'V4', 'II', 'aVL', 'V2', 'V5', 'III', 'aVF', 'V3', 'V6'];
const GRID_CELL = { width: 100, height: 46 };
const GRID_MV_RANGE = 1.1;
const GRID_SAMPLES = 120;

function tracePath(samples: number[]): string {
  const mid = GRID_CELL.height / 2;
  return samples
    .map((mv, i) => {
      const x = (i / (samples.length - 1)) * GRID_CELL.width;
      const clamped = Math.max(-GRID_MV_RANGE, Math.min(GRID_MV_RANGE, mv));
      const y = mid - (clamped / GRID_MV_RANGE) * mid;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function buildTwelveLeadGrid(inputs: EcgInputs, rrIntervalMs: number, selectedLead: LeadName): SceneNode[] {
  const cells: SceneNode[] = [];
  GRID_LAYOUT.forEach((lead, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const ox = col * GRID_CELL.width;
    const oy = row * GRID_CELL.height;
    const d = tracePath(sampleBeat(inputs, rrIntervalMs, lead, GRID_SAMPLES));
    const selected = lead === selectedLead;
    cells.push({
      type: 'group',
      transform: `translate(${ox}, ${oy})`,
      children: [
        { type: 'path', d: GRID_BASELINE, colorToken: 'text-faint', strokeWidth: 0.5 },
        {
          type: 'path',
          d,
          fill: 'none',
          colorToken: 'ecg-trace',
          strokeWidth: 1.4,
        },
        {
          type: 'text',
          x: 3,
          y: 9,
          text: lead,
          cls: 'pathLabel',
          colorToken: selected ? 'ecg-trace' : undefined,
        },
      ],
    });
  });
  return cells;
}

const GRID_BASELINE = `M0,${GRID_CELL.height / 2} L${GRID_CELL.width},${GRID_CELL.height / 2}`;

type Ctx = PresentationContext<EcgState, EcgDerived, EcgInputs, EcgHistoryPoint>;

export function buildEcgConductionPresentation(ctx: Ctx): ModulePresentation<EcgState, EcgDerived, EcgInputs, EcgHistoryPoint> {
  const { derived, inputs, state } = ctx;

  const heart = buildHeartConduction(derived.regions, 128, 126);

  const anatomyFrame: FrameNode = {
    type: 'frame',
    key: 'ecg-conduction',
    viewBox: [0, 0, 480, 300],
    ariaLabel:
      'Animated diagram of cardiac activation: the depolarisation wavefront sweeping the atria, conduction system and ventricles, alongside a hexaxial reference and a horizontal-plane reference showing the instantaneous electrical vector and the selected lead axis',
    defs: heart.defs,
    children: [
      heart.node,
      buildHexaxial(derived, 306, 84, 42),
      buildHorizontalPlane(derived, 422, 84, 42),
      { type: 'text', x: 306, y: 152, text: 'Frontal · limb', cls: 'pathLabel', anchor: 'middle' },
      { type: 'text', x: 422, y: 152, text: 'Horizontal · chest', cls: 'pathLabel', anchor: 'middle' },
      { type: 'text', x: 22, y: 252, text: derived.currentSegment, cls: 'valueLabel', colorToken: 'ecg-trace' },
      {
        type: 'text',
        x: 22,
        y: 272,
        text: `${derived.ecgVoltageMv >= 0 ? '+' : ''}${derived.ecgVoltageMv.toFixed(2)} mV · axis ${derived.meanQrsAxisDegrees.toFixed(0)}° (${derived.axisClassification})`,
        cls: 'valueLabel',
      },
      {
        type: 'text',
        x: 22,
        y: 288,
        text: `${derived.isDissociated ? 'Atria and ventricles dissociated' : `PR ${derived.prIntervalMs.toFixed(0)} ms`} · QRS ${derived.qrsDurationMs.toFixed(0)} ms · QTc ${derived.qtcMs.toFixed(0)} ms · R/S transition ${derived.rWaveTransitionLead ?? 'none'}`,
        cls: 'valueLabel',
      },
      { type: 'text', x: 296, y: 214, text: '▪ depolarising', cls: 'pathLabel', colorToken: 'depolarized' },
      { type: 'text', x: 296, y: 230, text: '▪ repolarising', cls: 'pathLabel', colorToken: 'repolarizing' },
      { type: 'text', x: 296, y: 246, text: '▪ conduction tissue', cls: 'pathLabel', colorToken: 'conduction-path' },
    ],
  };

  const gridFrame: FrameNode = {
    type: 'frame',
    key: 'ecg-twelve-lead',
    viewBox: [0, 0, 400, 138],
    ariaLabel: 'Twelve-lead grid, one representative conducted beat in each lead; the selected lead is highlighted',
    children: buildTwelveLeadGrid(inputs, state.lastRrIntervalMs, inputs.lead),
  };

  return {
    diagram: [anatomyFrame, gridFrame],
    controls: [
      {
        kind: 'toggle',
        label: 'Recording lead',
        key: 'lead',
        options: [
          { value: 'I', label: 'I' },
          { value: 'II', label: 'II' },
          { value: 'III', label: 'III' },
          { value: 'aVR', label: 'aVR' },
          { value: 'aVL', label: 'aVL' },
          { value: 'aVF', label: 'aVF' },
          { value: 'V1', label: 'V1' },
          { value: 'V2', label: 'V2' },
          { value: 'V3', label: 'V3' },
          { value: 'V4', label: 'V4' },
          { value: 'V5', label: 'V5' },
          { value: 'V6', label: 'V6' },
        ],
        colorToken: 'ecg-trace',
      },
      {
        kind: 'toggle',
        label: 'Rhythm',
        key: 'rhythm',
        options: [
          { value: 'sinus', label: 'Sinus' },
          { value: 'atrialFibrillation', label: 'Atrial fib' },
          { value: 'atrialFlutter', label: 'Flutter 2:1' },
          { value: 'wpw', label: 'WPW' },
          { value: 'sickSinus', label: 'Sick sinus' },
          { value: 'ventricularTachycardia', label: 'VT' },
          { value: 'torsades', label: 'Torsades' },
          { value: 'ventricularFibrillation', label: 'VF' },
        ],
        colorToken: 'ecg-trace',
      },
      { kind: 'slider', label: 'Sinus rate', key: 'heartRate', min: 30, max: 180, step: 1, unit: ' bpm' },
      { kind: 'slider', label: 'AV conduction delay', key: 'avDelayMs', min: 80, max: 400, step: 5, unit: ' ms' },
      { kind: 'slider', label: 'AV block severity', key: 'avBlockSeverity', min: 0, max: 1, step: 0.05, unit: ' %', format: 'percent' },
      { kind: 'slider', label: 'Right bundle conduction', key: 'rightBundleConduction', min: 0, max: 1, step: 0.05, unit: ' %', format: 'percent' },
      { kind: 'slider', label: 'Left bundle conduction', key: 'leftBundleConduction', min: 0, max: 1, step: 0.05, unit: ' %', format: 'percent' },
      { kind: 'slider', label: 'Ventricular APD', key: 'ventricularAPD', min: 200, max: 500, step: 5, unit: ' ms' },
      { kind: 'slider', label: 'Serum potassium', key: 'serumPotassium', min: 2.5, max: 8, step: 0.1, unit: ' mEq/L' },
      { kind: 'slider', label: 'Ischemic injury', key: 'ischemicInjury', min: 0, max: 1, step: 0.05, unit: ' %', format: 'percent' },
      {
        kind: 'toggle',
        label: 'Injury territory',
        key: 'injuryTerritory',
        options: [
          { value: 'anterior', label: 'Anterior' },
          { value: 'inferior', label: 'Inferior' },
          { value: 'lateral', label: 'Lateral' },
          { value: 'posterior', label: 'Posterior' },
        ],
        colorToken: 'depolarized',
      },
    ],
    readouts: [
      {
        label: 'Segment',
        value: (c) => c.derived.currentSegment,
        secondary: () => 'being written now',
        colorToken: 'ecg-trace',
      },
      {
        label: 'Voltage',
        value: (c) => `${c.derived.ecgVoltageMv >= 0 ? '+' : ''}${c.derived.ecgVoltageMv.toFixed(2)}`,
        unit: 'mV',
        secondary: (c) => `lead ${c.derived.lead}`,
        colorToken: 'ecg-trace',
      },
      {
        label: 'PR interval',
        value: (c) => (c.derived.isDissociated ? '—' : c.derived.prIntervalMs.toFixed(0)),
        unit: 'ms',
        setPoint: (c) => (c.derived.isDissociated ? undefined : c.inputs.avDelayMs),
        secondary: (c) =>
          c.derived.isDissociated ? 'dissociated' : c.derived.prIntervalMs > 200 ? 'first-degree block' : undefined,
        colorToken: 'conduction-path',
      },
      {
        label: 'QRS duration',
        value: (c) => c.derived.qrsDurationMs.toFixed(0),
        unit: 'ms',
        secondary: (c) => (c.derived.qrsDurationMs > 120 ? 'wide' : undefined),
        colorToken: 'depolarized',
      },
      { label: 'QT', value: (c) => c.derived.qtIntervalMs.toFixed(0), unit: 'ms', colorToken: 'repolarizing' },
      {
        label: 'QTc (Bazett)',
        value: (c) => c.derived.qtcMs.toFixed(0),
        unit: 'ms',
        secondary: (c) => (c.derived.qtcMs > 460 ? 'prolonged' : c.derived.qtcMs < 350 ? 'short' : undefined),
        colorToken: 'repolarizing',
      },
      {
        label: 'Atrial rate',
        value: (c) => c.derived.heartRateBpm.toFixed(0),
        unit: 'bpm',
        secondary: (c) =>
          c.derived.rhythm === 'atrialFibrillation' || c.derived.rhythm === 'ventricularFibrillation'
            ? 'no organised P waves'
            : c.derived.isDissociated && c.derived.rhythm !== 'sinus'
              ? 'marching independently'
              : undefined,
        colorToken: 'conduction-path',
      },
      {
        label: 'Ventricular rate',
        value: (c) => c.derived.ventricularRateBpm.toFixed(0),
        unit: 'bpm',
        secondary: (c) =>
          `mean ${c.derived.meanVentricularRateBpm.toFixed(0)}${c.derived.isDissociated ? ' · independent' : ''}`,
        colorToken: 'depolarized',
      },
      {
        label: 'Mean QRS axis',
        value: (c) => `${c.derived.meanQrsAxisDegrees.toFixed(0)}°`,
        secondary: (c) => c.derived.axisClassification,
        colorToken: 'ecg-trace',
      },
      {
        label: 'Rhythm',
        value: (c) => (c.derived.rhythmRegular ? 'Regular' : 'Irregular'),
        secondary: (c) => RHYTHM_NOTES[c.derived.rhythm],
        colorToken: 'conduction-path',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: `Lead ${inputs.lead} voltage`,
        unit: 'mV',
        colorToken: 'ecg-trace',
        domainMin: -1,
        domainMax: 1,
        data: (points) => points.map((p) => p.voltageMv),
      },
    ],
  };
}

const RHYTHM_NOTES: Record<EcgDerived['rhythm'], string> = {
  sinus: 'sinus',
  atrialFibrillation: 'atrial fibrillation',
  atrialFlutter: 'flutter circuit, 2:1 conduction',
  wpw: 'accessory pathway pre-excitation',
  sickSinus: 'SA pauses, junctional escape',
  ventricularTachycardia: 'ventricular focus, AV dissociation',
  torsades: 'polymorphic VT, axis twisting',
  ventricularFibrillation: 'no organised activity — arrest rhythm',
};
