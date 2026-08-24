import { useMemo } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { sampleCardiacCurve } from '../engine/cardiacFunctionCurve';
import { sampleVenousCurve } from '../engine/venousReturnCurve';
import { CARDIAC, CIRCULATION, PLOT, THORACIC } from '../engine/constants';
import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { CurvePoint, VenousReturnDerived } from '../engine/types';

interface GuytonDiagramProps {
  derived: VenousReturnDerived;
}

const PLOT_AREA = { left: 46, right: 300, top: 42, bottom: 228 };
const RESERVOIR = { x: 336, y: 62, width: 46, height: 116 };

function project(point: CurvePoint) {
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

/** The normal circulation, computed once, so every change reads as a shift away from it. */
const NORMAL_CARDIAC_PATH = toPath(sampleCardiacCurve(THORACIC.NORMAL_PRESSURE_MMHG, CARDIAC.MAX_OUTPUT_L_PER_MIN));
const NORMAL_VENOUS_PATH = toPath(
  sampleVenousCurve(
    (CIRCULATION.BLOOD_VOLUME_ML * (1 - CIRCULATION.UNSTRESSED_FRACTION)) / CIRCULATION.TOTAL_COMPLIANCE_ML_PER_MMHG,
    CIRCULATION.BASE_RESISTANCE,
  ),
);

const PRA_TICKS = [-6, 0, 6, 12, 18, 24];
const FLOW_TICKS = [0, 5, 10, 15];

export function GuytonDiagram({ derived }: GuytonDiagramProps) {
  const cardiacPath = useMemo(() => toPath(derived.cardiacCurve), [derived.cardiacCurve]);
  const venousPath = useMemo(() => toPath(derived.venousCurve), [derived.venousCurve]);

  const operating = project({ pra: derived.operatingPointPra, flow: derived.operatingPointFlow });
  const live = project({ pra: derived.rightAtrialPressureMmHg, flow: derived.cardiacOutputLPerMin });
  // Clamped to the plot: a Valsalva drives Pmsf to 28 mmHg, which projected past the axis and
  // put the tick and its label on top of the readout column.
  const pmsfX = clamp(
    project({ pra: derived.meanSystemicFillingPressureMmHg, flow: 0 }).x,
    PLOT_AREA.left,
    PLOT_AREA.right,
  );

  const stressedFraction = derived.stressedVolumeMl / Math.max(derived.totalBloodVolumeMl, 1);
  const stressedHeight = RESERVOIR.height * clamp(stressedFraction * 3, 0.02, 0.85);
  const volumeHeight = RESERVOIR.height * clamp(derived.totalBloodVolumeMl / 7000, 0.1, 1);

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Guyton diagram: the cardiac function curve and the venous return curve plotted against right atrial pressure, crossing at the operating point, beside a venous reservoir showing stressed and unstressed volume"
    >
      <text className={styles.pathLabel} x={22} y={24}>
        Cardiac output & venous return vs right atrial pressure
      </text>

      {/* Axes */}
      {FLOW_TICKS.map((flow) => {
        const { y } = project({ pra: PLOT.PRA_MIN, flow });
        return (
          <g key={`flow-${flow}`}>
            <line className={styles.gridLine} x1={PLOT_AREA.left} y1={y} x2={PLOT_AREA.right} y2={y} />
            <text className={styles.axisLabel} x={PLOT_AREA.left - 12} y={y + 3}>
              {flow}
            </text>
          </g>
        );
      })}
      {PRA_TICKS.map((pra) => {
        const { x } = project({ pra, flow: 0 });
        return (
          <text key={`pra-${pra}`} className={styles.axisLabel} x={x} y={PLOT_AREA.bottom + 14}>
            {pra}
          </text>
        );
      })}
      <line className={styles.axis} x1={PLOT_AREA.left} y1={PLOT_AREA.bottom} x2={PLOT_AREA.right} y2={PLOT_AREA.bottom} />
      <line className={styles.axis} x1={PLOT_AREA.left} y1={PLOT_AREA.top} x2={PLOT_AREA.left} y2={PLOT_AREA.bottom} />
      <text className={styles.axisLabel} x={PLOT_AREA.left - 30} y={PLOT_AREA.top + 6}>
        L/min
      </text>
      <text className={styles.axisLabel} x={(PLOT_AREA.left + PLOT_AREA.right) / 2} y={PLOT_AREA.bottom + 26}>
        right atrial pressure (mmHg)
      </text>

      {/* The normal circulation, behind everything. */}
      <path className={styles.referenceCurve} d={NORMAL_CARDIAC_PATH} />
      <path className={styles.referenceCurve} d={NORMAL_VENOUS_PATH} />

      <path className={styles.cardiacCurve} d={cardiacPath} />
      <path className={styles.venousCurve} d={venousPath} />

      {/* Where the venous return curve meets the axis IS the filling pressure. */}
      <line className={styles.fillingPressureMark} x1={pmsfX} y1={PLOT_AREA.bottom} x2={pmsfX} y2={PLOT_AREA.bottom - 12} />
      <text className={styles.axisLabel} x={pmsfX} y={PLOT_AREA.bottom - 16}>
        Pmsf
      </text>

      {/* The crossing, and where the system actually is on its way there. */}
      <line className={styles.operatingGuide} x1={operating.x} y1={operating.y} x2={operating.x} y2={PLOT_AREA.bottom} />
      <line className={styles.operatingGuide} x1={PLOT_AREA.left} y1={operating.y} x2={operating.x} y2={operating.y} />
      <circle className={styles.operatingPoint} cx={operating.x} cy={operating.y} r={4.5} />
      <circle className={styles.livePoint} cx={live.x} cy={live.y} r={7} />

      <text className={`${styles.curveLabel} ${styles.cardiacLabel}`} x={PLOT_AREA.right - 92} y={PLOT_AREA.top + 12}>
        cardiac function
      </text>
      <text className={`${styles.curveLabel} ${styles.venousLabel}`} x={PLOT_AREA.left + 6} y={PLOT_AREA.top + 12}>
        venous return
      </text>

      {/* --- The venous reservoir: what actually sets the filling pressure --- */}
      <text className={styles.pathLabel} x={314} y={54}>
        Venous reservoir
      </text>
      <rect className={styles.reservoirBody} x={RESERVOIR.x} y={RESERVOIR.y} width={RESERVOIR.width} height={RESERVOIR.height} rx={6} />
      <rect
        className={styles.unstressedFill}
        x={RESERVOIR.x + 2}
        y={RESERVOIR.y + RESERVOIR.height - volumeHeight}
        width={RESERVOIR.width - 4}
        height={Math.max(volumeHeight - stressedHeight, 0)}
      />
      <rect
        className={styles.stressedFill}
        x={RESERVOIR.x + 2}
        y={RESERVOIR.y + RESERVOIR.height - stressedHeight}
        width={RESERVOIR.width - 4}
        height={stressedHeight}
      />
      <text className={styles.pathLabel} x={390} y={RESERVOIR.y + RESERVOIR.height - stressedHeight / 2}>
        stressed {derived.stressedVolumeMl.toFixed(0)}
      </text>
      <text className={styles.pathLabel} x={390} y={RESERVOIR.y + 24}>
        unstressed {derived.unstressedVolumeMl.toFixed(0)}
      </text>

      <path
        className={styles.heartShape}
        d="M348,206 c-10,-12 6,-24 12,-12 c6,-12 22,0 12,12 l-12,14 z"
      />
      <text className={styles.valueLabel} x={382} y={210} textAnchor="start">
        CO {derived.cardiacOutputLPerMin.toFixed(2)} L/min
      </text>
      <text className={styles.pathLabel} x={314} y={230}>
        Pmsf {derived.meanSystemicFillingPressureMmHg.toFixed(1)} · Pra {derived.rightAtrialPressureMmHg.toFixed(1)} mmHg
      </text>
      <text className={styles.pathLabel} x={314} y={246}>
        RVR {derived.resistanceToVenousReturn.toFixed(2)} · MAP {derived.meanArterialPressureMmHg.toFixed(0)}
      </text>
      <text className={styles.pathLabel} x={314} y={262}>
        {derived.limitingFactor}-limited
      </text>
      <text className={styles.pathLabel} x={314} y={278}>
        ITP {derived.effectiveIntrathoracicPressure.toFixed(1)} mmHg
      </text>
    </DiagramFrame>
  );
}
