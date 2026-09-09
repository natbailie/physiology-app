import { clamp } from '@/shared/lib/math';
import { kidneyScene, lungsScene } from '@/shared/diagram/organShapes';
import { saO2 } from './engine/gasExchange';
import type { RespDerived, RespHistoryPoint, RespInputs, RespState } from './engine/types';
import type { FrameNode, ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

/* --- The anatomy diagram -------------------------------------------- */

/* Where the two organs sit. Every path below is anchored to them, so moving one is a matter of
 * moving a constant rather than re-typing nine coordinates. */
const LUNGS = { x: 214, y: 142, scale: 1 };
const KIDNEY = { x: 396, y: 252, scale: 0.85 };

const BLOOD_GAS_PATH = 'M214,222 L214,300';
const CHEMORECEPTOR_PATH = 'M172,62 C130,24 100,22 80,44';
const RENAL_PATH = 'M372,232 C324,204 292,182 266,166';

/* --- The Davenport diagram ------------------------------------------- */

const PLOT = { left: 52, right: 372, top: 34, bottom: 214 };
// Wider than a textbook Davenport, which usually starts at 7.0: a cardiac arrest in this model
// reaches 6.9, and pinning the most dramatic case against the wall of the plot hides the very
// thing it is there to show.
const PH_MIN = 6.8;
const PH_MAX = 7.7;
const HCO3_MIN = 0;
const HCO3_MAX = 45;

/** Lines of constant PaCO2, mmHg. */
const ISOPLETHS = [20, 30, 40, 60, 80, 100];
const PH_TICKS = [6.8, 6.9, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7];
const HCO3_TICKS = [0, 10, 20, 30, 40];

function project(pH: number, hco3: number) {
  const x = PLOT.left + ((clamp(pH, PH_MIN, PH_MAX) - PH_MIN) / (PH_MAX - PH_MIN)) * (PLOT.right - PLOT.left);
  const y = PLOT.bottom - ((clamp(hco3, HCO3_MIN, HCO3_MAX) - HCO3_MIN) / (HCO3_MAX - HCO3_MIN)) * (PLOT.bottom - PLOT.top);
  return { x, y };
}

/**
 * Henderson-Hasselbalch rearranged: at a fixed PaCO2, HCO3 = 0.03 x PaCO2 x 10^(pH - 6.1).
 * Every point on one of these curves has the same PaCO2, so moving ALONG an isopleth is a
 * purely metabolic change and moving ACROSS them is a purely respiratory one.
 */
function isoplethPath(paCO2: number): string {
  const points: string[] = [];
  for (let pH = PH_MIN; pH <= PH_MAX + 1e-9; pH += 0.02) {
    const hco3 = 0.03 * paCO2 * 10 ** (pH - 6.1);
    if (hco3 > HCO3_MAX * 1.2) break;
    const { x, y } = project(pH, hco3);
    points.push(`${points.length === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

/**
 * The normal buffer line: where a healthy person's blood actually goes when PaCO2 alone is
 * changed, because haemoglobin and plasma protein take up or release hydrogen ion as they do.
 * It is the reference the whole diagram is read against — vertical distance from this line is
 * the metabolic component of the disturbance and nothing else is.
 *
 * Drawn from the model's own acute buffer rule rather than a hand-fitted line, so if that
 * calibration changes the diagram changes with it.
 */
function bufferLinePath(): string {
  const points: string[] = [];
  for (const paCO2 of [15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100]) {
    const deviation = (paCO2 - 40) / 10;
    const hco3 = 24 + deviation * (deviation >= 0 ? 1 : 2);
    const pH = 6.1 + Math.log10(hco3 / (0.03 * paCO2));
    const { x, y } = project(pH, hco3);
    points.push(`${points.length === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

/** Where an isopleth's label sits: on the curve, near the top of the plot. */
function isoplethLabelPoint(paCO2: number) {
  const hco3 = HCO3_MAX * 0.96;
  const pH = 6.1 + Math.log10(hco3 / (0.03 * paCO2));
  if (pH > PH_MAX) {
    // Steep isopleths leave the top of the plot through the right edge instead.
    return project(PH_MAX - 0.03, 0.03 * paCO2 * 10 ** (PH_MAX - 0.03 - 6.1));
  }
  return project(pH, hco3);
}

function toPath(points: RespHistoryPoint[]): string {
  return points
    .map((point, index) => {
      const { x, y } = project(point.pH, point.plasmaHCO3);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

const ISOPLETH_ENTRIES = ISOPLETHS.map((paCO2) => ({ paCO2, d: isoplethPath(paCO2), label: isoplethLabelPoint(paCO2) }));
const BUFFER_LINE = bufferLinePath();

type Ctx = PresentationContext<RespState, RespDerived, RespInputs, RespHistoryPoint>;

export function buildRespiratoryPresentation(ctx: Ctx): ModulePresentation<RespState, RespDerived, RespInputs, RespHistoryPoint> {
  const { derived, history, baselineHistory } = ctx;

  const breathRate = clamp((derived.effectiveMinuteVentilation / 100) * 14, 3, 60);
  const ventDepth = clamp(derived.alveolarVentilationFraction, 0.5, 1.6);
  const bloodGasSpeed = clamp(derived.saO2 / 100, 0.1, 2);
  const hco3Intensity = clamp(derived.plasmaHCO3 / 24, 0.2, 1.8);
  const chemoActivation = clamp((derived.chemoreceptorDrive + 1) / 2, 0, 1);
  const renalActivation = clamp((derived.renalCompensationDrive + 1) / 2, 0, 1);

  const lungs = lungsScene(LUNGS, { breathRate, ventDepth, vqMismatch: derived.vqMismatch });
  /* The kidney is here for bicarbonate, so it is washed in the bicarbonate colour rather than in
   * the renal one — the reader is being asked to follow HCO3-, not to admire a kidney. */
  const kidney = kidneyScene(KIDNEY, { gfrIntensity: hco3Intensity, colorToken: 'bicarb', medullaToken: 'bicarb' });

  const anatomy: FrameNode = {
    type: 'frame',
    key: 'respiratory-anatomy',
    viewBox: [10, 14, 470, 306],
    ariaLabel:
      'Animated diagram of the lungs in anterior view — three lobes on the right and two on the left, separated by their fissures, with the trachea dividing at the carina into the main and lobar bronchi — connected by gas exchange to the tissues, by the chemoreceptor reflex to the brainstem, and by bicarbonate handling to a sectioned kidney',
    defs: [
      { type: 'marker', id: 'chemo-arrow', colorToken: 'co2' },
      { type: 'marker', id: 'renal-comp-arrow', colorToken: 'bicarb' },
      ...lungs.defs,
      ...kidney.defs,
    ],
    children: [
      { type: 'vessel', path: BLOOD_GAS_PATH, speed: bloodGasSpeed, colorToken: 'o2' },
      {
        type: 'axis',
        path: CHEMORECEPTOR_PATH,
        activation: chemoActivation,
        colorToken: 'co2',
        label: 'Chemoreceptors',
        markerId: 'chemo-arrow',
        // Centred, so this is the label's MIDDLE: at 26 the word began nine units left of the
        // frame and arrived on the phone as "hemoreceptors".
        labelX: 56,
        labelY: 72,
      },
      {
        type: 'axis',
        path: RENAL_PATH,
        activation: renalActivation,
        colorToken: 'bicarb',
        label: 'Renal HCO3-',
        markerId: 'renal-comp-arrow',
        labelX: 250,
        labelY: 212,
      },
      lungs.node,
      kidney.node,
      /* The asymmetry IS the teaching point, and it is the one thing about the lungs a
       * symmetrical pair of balloons actively taught wrong. Said once, in the corner. */
      { type: 'text', x: 466, y: 34, text: 'Right 3 lobes · left 2', cls: 'caption', anchor: 'end' },
      { type: 'text', x: 132, y: 208, text: 'Diaphragm', cls: 'anatomy', anchor: 'end' },
      { type: 'text', x: 214, y: 312, text: 'tissues', cls: 'pathLabel', anchor: 'middle' },
      { type: 'text', x: KIDNEY.x + 2, y: 300, text: 'Kidney', cls: 'organLabel', anchor: 'middle' },
    ] as SceneNode[],
  };

  const live = project(derived.pH, derived.plasmaHCO3);
  const normal = project(7.4, 24);
  const mixed = derived.interpretation.isMixed;
  const trailPath = toPath([...history]);
  const baselinePath = baselineHistory ? toPath([...baselineHistory]) : '';

  const davenport: FrameNode = {
    type: 'frame',
    key: 'respiratory-davenport',
    viewBox: [0, 0, 480, 260],
    ariaLabel: `Davenport diagram: plasma bicarbonate ${derived.plasmaHCO3.toFixed(0)} mEq/L plotted against pH ${derived.pH.toFixed(2)}, on lines of constant PaCO2. Current interpretation: ${derived.interpretation.label}`,
    children: [
      { type: 'text', x: 22, y: 20, text: 'Bicarbonate vs pH, on lines of constant PaCO2', cls: 'pathLabel' },
      ...HCO3_TICKS.map((hco3) => {
        const { y } = project(PH_MIN, hco3);
        return {
          type: 'group' as const,
          children: [
            { type: 'line' as const, x1: PLOT.left, y1: y, x2: PLOT.right, y2: y, cls: 'plotGrid' },
            { type: 'text' as const, x: PLOT.left - 12, y: y + 3, text: `${hco3}`, cls: 'axisLabel' },
          ],
        };
      }),
      ...PH_TICKS.map((pH) => {
        const { x } = project(pH, HCO3_MIN);
        return { type: 'text' as const, x, y: PLOT.bottom + 13, text: pH.toFixed(1), cls: 'axisLabel' };
      }),
      ...ISOPLETH_ENTRIES.map(({ paCO2, d, label }) => ({
        type: 'group' as const,
        children: [
          { type: 'path' as const, d, cls: 'isopleth' },
          { type: 'text' as const, x: label.x, y: label.y - 3, text: `${paCO2}`, cls: 'isoplethLabel' },
        ],
      })),
      { type: 'path', d: BUFFER_LINE, cls: 'bufferLine' },
      { type: 'line', x1: PLOT.left, y1: PLOT.bottom, x2: PLOT.right, y2: PLOT.bottom, cls: 'plotAxis' },
      { type: 'line', x1: PLOT.left, y1: PLOT.top, x2: PLOT.left, y2: PLOT.bottom, cls: 'plotAxis' },
      // Beside the tick row, not below it: the row underneath is the interpretation block.
      { type: 'text', x: PLOT.left - 34, y: PLOT.top + 6, text: 'mEq/L', cls: 'axisLabel' },
      { type: 'text', x: PLOT.right + 14, y: PLOT.bottom + 13, text: 'pH', cls: 'axisLabel' },
      // Which way is which. Bicarbonate runs up the page and pH across it, so the four
      // disorders land in the four corners: a HIGH bicarbonate with an ACID pH can only be a
      // respiratory acidosis the kidney has answered, while a high bicarbonate with an
      // alkaline pH is the metabolic alkalosis causing it. Reading the corner is the
      // diagnosis, which is the entire reason to draw the plot this way round.
      { type: 'text', x: PLOT.left + 64, y: PLOT.top + 34, text: 'respiratory acidosis', cls: 'regionLabel' },
      { type: 'text', x: PLOT.right - 62, y: PLOT.top + 34, text: 'metabolic alkalosis', cls: 'regionLabel' },
      { type: 'text', x: PLOT.left + 62, y: PLOT.bottom - 10, text: 'metabolic acidosis', cls: 'regionLabel' },
      { type: 'text', x: PLOT.right - 64, y: PLOT.bottom - 10, text: 'respiratory alkalosis', cls: 'regionLabel' },
      { type: 'circle', cx: normal.x, cy: normal.y, r: 4, cls: 'normalPoint' },
      ...(baselinePath ? [{ type: 'path' as const, d: baselinePath, cls: 'baselineTrail' }] : []),
      ...(history.length > 1 ? [{ type: 'path' as const, d: trailPath, cls: 'trail' }] : []),
      { type: 'circle', cx: live.x, cy: live.y, r: 4.5, cls: 'livePoint' },
      { type: 'text', x: 22, y: 238, text: derived.interpretation.label, cls: mixed ? 'verdictMixed' : 'verdict' },
      {
        type: 'text',
        x: 22,
        y: 252,
        text: `pH ${derived.pH.toFixed(2)} · PaCO2 ${derived.paCO2.toFixed(0)} · HCO3 ${derived.plasmaHCO3.toFixed(0)} · gap ${derived.anionGapMEqL.toFixed(0)}${derived.deltaRatio !== 0 ? ` · delta ratio ${derived.deltaRatio.toFixed(1)}` : ''}`,
        cls: 'pathLabel',
      },
    ],
  };

  return {
    diagram: [anatomy, davenport],
    controls: [
      { kind: 'slider', label: 'Minute ventilation', key: 'minuteVentilation', min: 20, max: 300, step: 5, unit: '%' },
      { kind: 'slider', label: 'V/Q mismatch', key: 'vqMismatch', min: 0, max: 1, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Inspired O2 (FiO2)', key: 'fiO2', min: 0.05, max: 1, step: 0.01, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'CO2 production', key: 'co2Production', min: 50, max: 300, step: 5, unit: '%' },
      { kind: 'slider', label: 'Metabolic acid load', key: 'metabolicAcidLoad', min: -100, max: 100, step: 5 },
      {
        kind: 'toggle',
        label: 'Acid type',
        key: 'acidType',
        options: [
          { value: 'anionGap', label: 'Organic (gap)' },
          { value: 'hyperchloraemic', label: 'Hyperchloraemic' },
        ],
        colorToken: 'ph',
      },
      { kind: 'slider', label: 'Renal compensation capacity', key: 'renalCompensationCapacity', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
    ],
    readouts: [
      { label: 'PaO2', value: (c) => c.derived.paO2.toFixed(0), unit: 'mmHg', colorToken: 'o2' },
      { label: 'PaCO2', value: (c) => c.derived.paCO2.toFixed(0), unit: 'mmHg', colorToken: 'co2' },
      { label: 'pH', value: (c) => c.derived.pH.toFixed(2), colorToken: 'ph' },
      { label: 'HCO3-', value: (c) => c.derived.plasmaHCO3.toFixed(0), unit: 'mEq/L', colorToken: 'bicarb' },
      { label: 'SaO2', value: (c) => c.derived.saO2.toFixed(0), unit: '%', colorToken: 'o2' },
      // The slider sets the ventilation the patient is ordered; chemoreceptor drive then scales
      // it, so the achieved value routinely differs from the control.
      {
        label: 'Minute ventilation',
        value: (c) => c.derived.effectiveMinuteVentilation.toFixed(0),
        unit: '%',
        setPoint: (c) => c.inputs.minuteVentilation,
        colorToken: 'co2',
      },
      { label: 'A-a gradient', value: (c) => c.derived.aaGradient.toFixed(0), unit: 'mmHg', colorToken: 'text' },
      { label: 'Anion gap', value: (c) => c.derived.anionGapMEqL.toFixed(0), unit: 'mEq/L', colorToken: 'ph' },
      {
        label: 'Interpretation',
        value: (c) => c.derived.interpretation.short,
        secondary: (c) => c.derived.interpretation.detail,
        colorToken: derived.interpretation.isMixed ? 'danger' : 'bicarb',
        wide: true,
      },
    ],
    charts: [
      { kind: 'sparkline', label: 'pH', colorToken: 'ph', domainMin: 6.9, domainMax: 7.7, data: (points) => points.map((p) => p.pH) },
      { kind: 'sparkline', label: 'PaCO2', unit: 'mmHg', colorToken: 'co2', domainMin: 10, domainMax: 100, data: (points) => points.map((p) => p.paCO2) },
      { kind: 'sparkline', label: 'SaO2', unit: '%', colorToken: 'o2', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.saO2) },
      {
        kind: 'od-curve',
        curveFn: saO2,
        currentX: (ctx) => ctx.derived.paO2,
        currentY: (ctx) => ctx.derived.saO2,
        xDomain: [0, 120],
        yDomain: [0, 100],
        colorToken: 'o2',
        xLabel: 'PaO2 (mmHg)',
        yLabel: 'SaO2 (%)',
      },
    ],
  };
}