import { clamp } from '@/shared/lib/math';
import { CARDIAC, CIRCULATION, PLOT, THORACIC } from './engine/constants';
import { sampleCardiacCurve } from './engine/cardiacFunctionCurve';
import { sampleVenousCurve } from './engine/venousReturnCurve';
import type {
  CurvePoint,
  VenousReturnDerived,
  VenousReturnHistoryPoint,
  VenousReturnInputs,
  VenousReturnState,
} from './engine/types';
import type { FrameNode, ModulePresentation, PresentationContext } from '@/shared/presentation/types';

/* --- The Guyton plot --------------------------------------------------- */

const PLOT_AREA = { left: 46, right: 300, top: 42, bottom: 228 };
const RESERVOIR = { x: 336, y: 62, width: 46, height: 116 };

function project(point: CurvePoint): { x: number; y: number } {
  const x =
    PLOT_AREA.left + ((point.pra - PLOT.PRA_MIN) / (PLOT.PRA_MAX - PLOT.PRA_MIN)) * (PLOT_AREA.right - PLOT_AREA.left);
  const y = PLOT_AREA.bottom - (clamp(point.flow, 0, PLOT.MAX_FLOW_L_PER_MIN) / PLOT.MAX_FLOW_L_PER_MIN) * (PLOT_AREA.bottom - PLOT_AREA.top);
  return { x, y };
}

function toPath(points: CurvePoint[]): string {
  return points
    .map((point, index) => {
      const { x, y } = project(point);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** A hollow ring, drawn as a path because the schema's circle has no stroke — only fill. */
function ring(cx: number, cy: number, r: number): string {
  return `M${(cx - r).toFixed(1)},${cy.toFixed(1)} a${r},${r} 0 1,0 ${(2 * r).toFixed(1)},0 a${r},${r} 0 1,0 ${(-2 * r).toFixed(1)},0`;
}

/** The normal circulation, computed once, so every change reads as a shift away from it. */
const NORMAL_CARDIAC_PATH = toPath(sampleCardiacCurve(THORACIC.NORMAL_PRESSURE_MMHG, CARDIAC.MAX_OUTPUT_L_PER_MIN));
const NORMAL_VENOUS_PATH = toPath(
  sampleVenousCurve(
    (CIRCULATION.BLOOD_VOLUME_ML * (1 - CIRCULATION.UNSTRESSED_FRACTION)) / CIRCULATION.TOTAL_COMPLIANCE_ML_PER_MMHG,
    CIRCULATION.BASE_RESISTANCE,
  ),
);

/** The path the operating point took through the same state space the slow charts plot. */
function historyTrail(points: readonly VenousReturnHistoryPoint[]): string {
  return points
    .map((p, index) => {
      const { x, y } = project({ pra: p.pra, flow: p.cardiacOutput });
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

const PRA_TICKS = [-6, 0, 6, 12, 18, 24];
const FLOW_TICKS = [0, 5, 10, 15];

type Ctx = PresentationContext<VenousReturnState, VenousReturnDerived, VenousReturnInputs, VenousReturnHistoryPoint>;

export function buildVenousReturnPresentation(ctx: Ctx): ModulePresentation<
  VenousReturnState,
  VenousReturnDerived,
  VenousReturnInputs,
  VenousReturnHistoryPoint
> {
  const { derived, history, baselineHistory } = ctx;

  const cardiacPath = toPath(derived.cardiacCurve);
  const venousPath = toPath(derived.venousCurve);

  const operating = project({ pra: derived.operatingPointPra, flow: derived.operatingPointFlow });
  const live = project({ pra: derived.rightAtrialPressureMmHg, flow: derived.cardiacOutputLPerMin });
  // Clamped to the plot: a Valsalva drives Pmsf to 28 mmHg, which would project past the axis
  // and put the tick and its label on top of the readout column.
  const pmsfX = clamp(project({ pra: derived.meanSystemicFillingPressureMmHg, flow: 0 }).x, PLOT_AREA.left, PLOT_AREA.right);

  const stressedFraction = derived.stressedVolumeMl / Math.max(derived.totalBloodVolumeMl, 1);
  const stressedHeight = RESERVOIR.height * clamp(stressedFraction * 3, 0.02, 0.85);
  const volumeHeight = RESERVOIR.height * clamp(derived.totalBloodVolumeMl / 7000, 0.1, 1);

  const trailPath = history.length > 1 ? historyTrail(history) : '';
  const baselinePath = baselineHistory && baselineHistory.length > 1 ? historyTrail(baselineHistory) : '';

  const diagram: FrameNode = {
    type: 'frame',
    key: 'venous-return-guyton',
    viewBox: [0, 0, 480, 300],
    ariaLabel:
      'Guyton diagram: the cardiac function curve and the venous return curve plotted against right atrial pressure crossing at the operating point, beside a venous reservoir showing stressed and unstressed volume',
    children: [
      { type: 'text', x: 22, y: 24, text: 'Cardiac output & venous return vs right atrial pressure', cls: 'pathLabel' },

      // Flow grid lines and tick labels (horizontal).
      ...FLOW_TICKS.map((flow) => {
        const { y } = project({ pra: PLOT.PRA_MIN, flow });
        return {
          type: 'group' as const,
          children: [
            { type: 'line' as const, x1: PLOT_AREA.left, y1: y, x2: PLOT_AREA.right, y2: y, colorToken: 'grid-line' },
            { type: 'text' as const, x: PLOT_AREA.left - 12, y: y + 3, text: `${flow}`, cls: 'tickLabel' },
          ],
        };
      }),
      // Right atrial pressure tick labels (horizontal, along the bottom).
      ...PRA_TICKS.map((pra) => {
        const { x } = project({ pra, flow: 0 });
        return { type: 'text' as const, x, y: PLOT_AREA.bottom + 14, text: `${pra}`, cls: 'tickLabel' };
      }),

      // Axes.
      { type: 'line', x1: PLOT_AREA.left, y1: PLOT_AREA.bottom, x2: PLOT_AREA.right, y2: PLOT_AREA.bottom, colorToken: 'text-faint' },
      { type: 'line', x1: PLOT_AREA.left, y1: PLOT_AREA.top, x2: PLOT_AREA.left, y2: PLOT_AREA.bottom, colorToken: 'text-faint' },
      { type: 'text', x: PLOT_AREA.left - 30, y: PLOT_AREA.top + 6, text: 'L/min', cls: 'tickLabel' },
      { type: 'text', x: (PLOT_AREA.left + PLOT_AREA.right) / 2, y: PLOT_AREA.bottom + 30, text: 'right atrial pressure (mmHg)', cls: 'tickLabel' },

      // The normal circulation, held faintly behind whatever the sliders are doing, so a change
      // reads as a SHIFT of a curve rather than as a new picture.
      { type: 'path', d: NORMAL_CARDIAC_PATH, colorToken: 'text-faint', fill: 'none', strokeWidth: 1 },
      { type: 'path', d: NORMAL_VENOUS_PATH, colorToken: 'text-faint', fill: 'none', strokeWidth: 1 },

      // The live curves.
      { type: 'path', d: cardiacPath, colorToken: 'artery', fill: 'none', strokeWidth: 2 },
      { type: 'path', d: venousPath, colorToken: 'venous', fill: 'none', strokeWidth: 2 },

      // Where the venous return curve meets the axis IS the filling pressure.
      { type: 'line', x1: pmsfX, y1: PLOT_AREA.bottom, x2: pmsfX, y2: PLOT_AREA.bottom - 12, colorToken: 'venous' },
      { type: 'text', x: pmsfX, y: PLOT_AREA.bottom - 18, text: 'Pmsf', cls: 'tickLabel' },

      // The crossing, and where the system actually is on its way there.
      { type: 'line', x1: operating.x, y1: operating.y, x2: operating.x, y2: PLOT_AREA.bottom, colorToken: 'pv-loop' },
      { type: 'line', x1: PLOT_AREA.left, y1: operating.y, x2: operating.x, y2: operating.y, colorToken: 'pv-loop' },
      { type: 'circle', cx: operating.x, cy: operating.y, r: 4.5, fill: 'pv-loop' },
      // The live point is a hollow ring so it stays visible against the filled operating dot.
      { type: 'path', d: ring(live.x, live.y, 7), colorToken: 'pv-loop', fill: 'none', strokeWidth: 1.5 },

      // The path the system took to get here through the same state space.
      ...(trailPath ? [{ type: 'path' as const, d: trailPath, colorToken: 'pv-loop', fill: 'none', strokeWidth: 1.4 }] : []),
      ...(baselinePath ? [{ type: 'path' as const, d: baselinePath, colorToken: 'text-faint', fill: 'none', strokeWidth: 1.4 }] : []),

      // Region labels: which curve is constraining the output on each side of the plot.
      { type: 'text', x: PLOT_AREA.left + 6, y: PLOT_AREA.top + 12, text: 'venous return', cls: 'caption', anchor: 'start', colorToken: 'venous' },
      { type: 'text', x: PLOT_AREA.right - 92, y: PLOT_AREA.top + 12, text: 'cardiac function', cls: 'caption', anchor: 'start', colorToken: 'artery' },
      /* Anchored to the plot's edges rather than centred on a point inside it. Both of these are
         wider than the space their centre left them: the first reached back over the y-axis ticks
         and the second over the Pmsf marker. */
      { type: 'text', x: PLOT_AREA.left + 8, y: PLOT_AREA.top + 44, text: 'preload-limited — the veins set output', cls: 'caption', anchor: 'start' },
      { type: 'text', x: PLOT_AREA.right - 6, y: PLOT_AREA.bottom - 32, text: 'pump-limited — the heart at its ceiling', cls: 'caption', anchor: 'end' },

      // --- The venous reservoir: what actually sets the filling pressure ---
      { type: 'text', x: 314, y: 54, text: 'Venous reservoir', cls: 'anatomy' },
      { type: 'rect', x: RESERVOIR.x, y: RESERVOIR.y, width: RESERVOIR.width, height: RESERVOIR.height, fill: 'none' },
      { type: 'rect', x: RESERVOIR.x + 2, y: RESERVOIR.y + RESERVOIR.height - volumeHeight, width: RESERVOIR.width - 4, height: Math.max(volumeHeight - stressedHeight, 0), fill: 'venous' },
      { type: 'rect', x: RESERVOIR.x + 2, y: RESERVOIR.y + RESERVOIR.height - stressedHeight, width: RESERVOIR.width - 4, height: stressedHeight, fill: 'pv-loop' },
      { type: 'text', x: 390, y: RESERVOIR.y + RESERVOIR.height - stressedHeight / 2, text: `stressed ${derived.stressedVolumeMl.toFixed(0)}`, cls: 'pathLabel', anchor: 'start' },
      { type: 'text', x: 390, y: RESERVOIR.y + 24, text: `unstressed ${derived.unstressedVolumeMl.toFixed(0)}`, cls: 'pathLabel', anchor: 'start' },

      // The heart, drawn with primitives (no heart in the shared OrganName union here).
      { type: 'path', d: 'M348,206 c-10,-12 6,-24 12,-12 c6,-12 22,0 12,12 l-12,14 z', colorToken: 'artery', fill: 'pv-loop' },
      { type: 'text', x: 382, y: 210, text: `CO ${derived.cardiacOutputLPerMin.toFixed(2)} L/min`, cls: 'valueLabel', anchor: 'start' },
      { type: 'text', x: 314, y: 230, text: `Pmsf ${derived.meanSystemicFillingPressureMmHg.toFixed(1)} · Pra ${derived.rightAtrialPressureMmHg.toFixed(1)} mmHg`, cls: 'pathLabel', anchor: 'start' },
      { type: 'text', x: 314, y: 246, text: `RVR ${derived.resistanceToVenousReturn.toFixed(2)} · MAP ${derived.meanArterialPressureMmHg.toFixed(0)}`, cls: 'pathLabel', anchor: 'start' },
      { type: 'text', x: 314, y: 262, text: `${derived.limitingFactor}-limited`, cls: 'valueLabel', anchor: 'start' },
      { type: 'text', x: 314, y: 278, text: `ITP ${derived.effectiveIntrathoracicPressure.toFixed(1)} mmHg`, cls: 'pathLabel', anchor: 'start' },
    ],
  };

  const equilibrated = (derived: VenousReturnDerived) =>
    Math.abs(derived.venousReturnLPerMin - derived.cardiacOutputLPerMin) < 0.05;
  const LIMIT_EXPLANATION: Record<VenousReturnDerived['limitingFactor'], string> = {
    preload: 'the veins are setting the output',
    pump: 'the heart is at its ceiling',
    afterload: 'the ceiling is pulled down by afterload',
  };

  return {
    diagram: [diagram],
    controls: [
      { kind: 'slider', label: 'Blood volume', key: 'bloodVolumeMl', min: 3000, max: 7000, step: 50, unit: ' mL' },
      { kind: 'slider', label: 'Unstressed volume', key: 'unstressedVolumeFraction', min: 0.6, max: 0.95, step: 0.01, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Venous compliance', key: 'venousCompliance', min: 0.3, max: 3, step: 0.05, format: 'decimal' },
      { kind: 'slider', label: 'Venous resistance', key: 'venousResistance', min: 0.3, max: 3, step: 0.05, format: 'decimal' },
      { kind: 'slider', label: 'AV shunt', key: 'arteriovenousShunt', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Contractility', key: 'contractility', min: 0, max: 2.5, step: 0.05, format: 'decimal' },
      { kind: 'slider', label: 'Heart rate', key: 'heartRate', min: 30, max: 200, step: 1, unit: ' bpm' },
      { kind: 'slider', label: 'Intrathoracic pressure', key: 'intrathoracicPressure', min: -10, max: 20, step: 0.5, unit: ' mmHg' },
      { kind: 'slider', label: 'Systemic vascular resistance', key: 'systemicVascularResistance', min: 0.3, max: 3, step: 0.05, format: 'decimal' },
    ],
    readouts: [
      {
        label: 'Cardiac output',
        value: (c) => c.derived.cardiacOutputLPerMin.toFixed(2),
        unit: 'L/min',
        secondary: (c) => (equilibrated(c.derived) ? 'at the crossing point' : 'still moving toward it'),
        colorToken: 'artery',
      },
      {
        label: 'Venous return',
        value: (c) => c.derived.venousReturnLPerMin.toFixed(2),
        unit: 'L/min',
        secondary: (c) => (equilibrated(c.derived) ? 'equals output' : `${(c.derived.venousReturnLPerMin - c.derived.cardiacOutputLPerMin).toFixed(2)} mismatch`),
        colorToken: 'venous',
      },
      {
        label: 'Right atrial pressure',
        value: (c) => c.derived.rightAtrialPressureMmHg.toFixed(2),
        unit: 'mmHg',
        secondary: (c) => `crossing at ${c.derived.operatingPointPra.toFixed(2)}`,
        colorToken: 'pv-loop',
      },
      {
        label: 'Mean systemic filling',
        value: (c) => c.derived.meanSystemicFillingPressureMmHg.toFixed(2),
        unit: 'mmHg',
        secondary: () => 'set by the vessels, not the heart',
        colorToken: 'venous',
      },
      {
        label: 'Stressed volume',
        value: (c) => c.derived.stressedVolumeMl.toFixed(0),
        unit: 'mL',
        secondary: () => 'the only part generating pressure',
        colorToken: 'venous',
      },
      {
        label: 'Unstressed volume',
        value: (c) => c.derived.unstressedVolumeMl.toFixed(0),
        unit: 'mL',
        secondary: () => 'recruitable by venoconstriction',
        colorToken: 'venous',
      },
      {
        label: 'Blood volume',
        value: (c) => c.derived.totalBloodVolumeMl.toFixed(0),
        unit: 'mL',
        setPoint: (c) => c.inputs.bloodVolumeMl,
        secondary: (c) => `compliance ${c.derived.totalComplianceMlPerMmHg.toFixed(0)} mL/mmHg`,
        colorToken: 'hemoglobin',
      },
      {
        label: 'Resistance to VR',
        value: (c) => c.derived.resistanceToVenousReturn.toFixed(2),
        secondary: () => 'mostly venous, barely arterial',
        colorToken: 'resistance',
      },
      {
        label: 'Cardiac curve plateau',
        value: (c) => c.derived.cardiacCurvePlateau.toFixed(1),
        unit: 'L/min',
        secondary: (c) => `${((c.derived.cardiacOutputLPerMin / Math.max(c.derived.cardiacCurvePlateau, 0.01)) * 100).toFixed(0)}% of it used`,
        colorToken: 'artery',
      },
      {
        label: 'Limiting factor',
        value: (c) => c.derived.limitingFactor,
        secondary: (c) => LIMIT_EXPLANATION[c.derived.limitingFactor],
        colorToken: 'pv-loop',
      },
      {
        label: 'Intrathoracic pressure',
        value: (c) => c.derived.effectiveIntrathoracicPressure.toFixed(1),
        unit: 'mmHg',
        setPoint: (c) => c.inputs.intrathoracicPressure,
        secondary: () => 'what the heart is squeezed by',
        colorToken: 'compliance',
      },
      {
        label: 'Mean arterial pressure',
        value: (c) => c.derived.meanArterialPressureMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: () => 'output x resistance',
        colorToken: 'artery',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Cardiac output',
        secondaryLabel: 'venous return',
        unit: 'L/min',
        colorToken: 'artery',
        secondaryColorToken: 'venous',
        domainMin: 0,
        domainMax: PLOT.MAX_FLOW_L_PER_MIN,
        data: (points) => points.map((p) => p.cardiacOutput),
        secondaryData: (points) => points.map((p) => p.venousReturn),
      },
      {
        kind: 'sparkline',
        label: 'Right atrial pressure',
        unit: 'mmHg',
        colorToken: 'pv-loop',
        domainMin: PLOT.PRA_MIN,
        domainMax: PLOT.PRA_MAX,
        data: (points) => points.map((p) => p.pra),
      },
      {
        kind: 'sparkline',
        label: 'Mean systemic filling pressure',
        unit: 'mmHg',
        colorToken: 'venous',
        domainMin: 0,
        domainMax: 20,
        data: (points) => points.map((p) => p.meanSystemicFillingPressure),
      },
    ],
  };
}
