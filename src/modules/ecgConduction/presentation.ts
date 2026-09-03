import { clamp } from '@/shared/lib/math';
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

/* --- Conduction-system anatomy (translated from HeartConduction.tsx) --- */

const CHAMBER_PATHS: Partial<Record<RegionId, string>> = {
  rightAtrium: 'M-64,-64 C-30,-76 -6,-70 -4,-44 C-3,-26 -22,-18 -44,-22 C-62,-25 -72,-44 -64,-64 Z',
  leftAtrium: 'M64,-64 C30,-76 6,-70 4,-44 C3,-26 22,-18 44,-22 C62,-25 72,-44 64,-64 Z',
  rvFreeWall: 'M-58,-14 C-30,-20 -12,-10 -10,16 C-9,44 -24,66 -44,62 C-62,58 -70,26 -58,-14 Z',
  lvFreeWall: 'M18,-4 C48,-12 72,10 70,42 C68,72 44,88 22,80 C4,73 2,40 8,16 C11,4 14,-1 18,-4 Z',
  lvBase: 'M14,-24 C40,-32 62,-22 64,-6 C65,6 46,10 30,6 C20,3 14,-8 14,-24 Z',
  septum: 'M-6,-16 C2,-18 8,-6 8,18 C8,44 2,64 -6,62 C-12,60 -14,38 -14,20 C-14,2 -12,-14 -6,-16 Z',
};

const CHAMBER_LABELS: Partial<Record<RegionId, { x: number; y: number; text: string }>> = {
  rightAtrium: { x: -36, y: -46, text: 'RA' },
  leftAtrium: { x: 36, y: -46, text: 'LA' },
  rvFreeWall: { x: -40, y: 28, text: 'RV' },
  lvFreeWall: { x: 42, y: 50, text: 'LV' },
  septum: { x: -2, y: 88, text: 'Septum' },
};

const CONDUCTION_PATHS: Partial<Record<RegionId, string>> = {
  hisBundle: 'M-2,-18 L-2,4',
  rightBundle: 'M-2,4 C-10,16 -20,28 -30,44',
  leftBundle: 'M-2,4 C10,16 24,28 38,44',
};

const NODE_POSITIONS: Partial<
  Record<RegionId, { cx: number; cy: number; r: number; label: string; labelX: number; labelY: number }>
> = {
  saNode: { cx: -50, cy: -60, r: 5, label: 'SA', labelX: -50, labelY: -74 },
  avNode: { cx: -2, cy: -24, r: 4.5, label: 'AV', labelX: 16, labelY: -24 },
};

/** Waist order for the heart drawing — chambers first, conduction tissue on top. */
const CHAMBER_ORDER: RegionId[] = ['rightAtrium', 'leftAtrium', 'rvFreeWall', 'lvBase', 'lvFreeWall', 'septum'];

/** Map a region's membrane state onto the module's two signal colours, so the wavefront
 *  depolarising sweep is visible on the heart while its wave is written on the strip. */
function regionVisual(state: RegionState): { fill: string; stroke: string } {
  switch (state) {
    case 'depolarizing':
    case 'depolarized':
      return { fill: 'depolarized', stroke: 'depolarized' };
    case 'repolarizing':
      return { fill: 'repolarizing', stroke: 'repolarizing' };
    default:
      return { fill: 'text-faint', stroke: 'text-faint' };
  }
}

function buildHeartConduction(regions: RegionActivation[], x: number, y: number): SceneNode {
  const byId = new Map(regions.map((region) => [region.id, region]));
  const children: SceneNode[] = [];

  for (const id of CHAMBER_ORDER) {
    const path = CHAMBER_PATHS[id];
    const region = byId.get(id);
    if (!path || !region) continue;
    const visual = regionVisual(region.state);
    children.push({
      type: 'path',
      d: path,
      fill: visual.fill,
      colorToken: visual.stroke,
      strokeWidth: 2,
    });
  }

  for (const [id, path] of Object.entries(CONDUCTION_PATHS) as [RegionId, string][]) {
    const region = byId.get(id);
    const active = region?.state === 'depolarizing';
    children.push({
      type: 'path',
      d: path,
      fill: 'none',
      colorToken: 'conduction-path',
      strokeWidth: active ? 2.5 : 2,
    });
  }

  for (const [, node] of Object.entries(NODE_POSITIONS) as [
    RegionId,
    NonNullable<(typeof NODE_POSITIONS)[RegionId]>,
  ][]) {
    children.push(
      {
        type: 'circle',
        cx: node.cx,
        cy: node.cy,
        r: node.r,
        fill: 'conduction-path',
      },
      {
        type: 'text',
        x: node.labelX,
        y: node.labelY,
        text: node.label,
        cls: 'pathLabel',
        anchor: 'middle',
      },
    );
  }

  for (const [, label] of Object.entries(CHAMBER_LABELS) as [
    RegionId,
    NonNullable<(typeof CHAMBER_LABELS)[RegionId]>,
  ][]) {
    children.push({ type: 'text', x: label.x, y: label.y, text: label.text, cls: 'organLabel' });
  }

  return { type: 'group', transform: `translate(${x}, ${y})`, children };
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

  const anatomyFrame: FrameNode = {
    type: 'frame',
    key: 'ecg-conduction',
    viewBox: [0, 0, 480, 300],
    ariaLabel:
      'Animated diagram of cardiac activation: the depolarisation wavefront sweeping the atria, conduction system and ventricles, alongside a hexaxial reference and a horizontal-plane reference showing the instantaneous electrical vector and the selected lead axis',
    children: [
      buildHeartConduction(derived.regions, 128, 126),
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
