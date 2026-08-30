import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import { OXYGEN } from '../engine/constants';
import type { ExerciseDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface ExerciseDiagramProps {
  derived: ExerciseDerived;
}

/** VO2-vs-workload plot with the ceiling line, lactate threshold marker and operating point,
 * plus blood-flow redistribution bars. */
export function ExerciseDiagram({ derived }: ExerciseDiagramProps) {
  const PLOT = { x: 320, y: 60, width: 210, height: 140 };
  const MAX_W = 400;
  const toX = (watts: number) => PLOT.x + (clamp(watts, 0, MAX_W) / MAX_W) * PLOT.width;
  const toY = (vo2: number) => PLOT.y + PLOT.height - (clamp(vo2 / 1000, 0, 5) / 5) * PLOT.height;

  // Demand line: linear in watts.
  const demandPath = `M${toX(0)},${toY(OXYGEN.REST_VO2_ML_MIN)} L${toX(MAX_W)},${toY(OXYGEN.REST_VO2_ML_MIN + MAX_W * OXYGEN.ML_PER_WATT)}`;
  const thresholdWatts = ((derived.lactateThresholdFraction * derived.vo2MaxMlMin) - OXYGEN.REST_VO2_ML_MIN) / OXYGEN.ML_PER_WATT;

  const BAR = (y: number) => ({ x: 44, y, width: 200, height: 15 });
  const musclePct = derived.muscleFlowSharePct / 100;

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="VO2 against workload with ceiling and redistribution">
      {/* VO2 vs workload. */}
      <rect className={styles.axis} x={PLOT.x} y={PLOT.y} width={PLOT.width} height={PLOT.height} fill="none" />
      <path className={styles.workCurve} d={demandPath} />
      <line
        className={styles.maxLine}
        x1={PLOT.x}
        x2={PLOT.x + PLOT.width}
        y1={toY(derived.vo2MaxMlMin)}
        y2={toY(derived.vo2MaxMlMin)}
      />
      <line className={styles.thresholdLine} x1={toX(thresholdWatts)} x2={toX(thresholdWatts)} y1={PLOT.y} y2={PLOT.y + PLOT.height} />
      <circle
        className={styles.operatingPoint}
        cx={toX(clamp((derived.vo2DemandMlMin - OXYGEN.REST_VO2_ML_MIN) / OXYGEN.ML_PER_WATT, 0, MAX_W))}
        cy={toY(derived.vo2MlMin)}
        r={5}
      />
      {/* Starts left of the plot so the ceiling fits on one line; the row is empty over there. */}
      <DiagramText className={styles.label} x={PLOT.x - 44} y={PLOT.y - 12} maxWidth={560 - PLOT.x + 20}>
        VO2 vs WORKLOAD · max {derived.vo2MaxMlMin.toFixed(0)} mL/min
      </DiagramText>
      {/* Right-aligned under the plot: left-aligned it ran into the flow-redistribution caption. */}
      <text className={styles.caption} x={PLOT.x + PLOT.width} y={PLOT.y + PLOT.height + 16} textAnchor="end">
        watts →
      </text>
      <DiagramText className={styles.caption} x={PLOT.x + 6} y={PLOT.y + 14} maxWidth={560 - PLOT.x - 22}>
        VO2 {derived.vo2MlMin.toFixed(0)} ({((derived.engagementFraction) * 100).toFixed(0)}% of max)
      </DiagramText>
      {derived.aboveVo2Max && (
        <DiagramText className={styles.alarm} x={PLOT.x + 4} y={PLOT.y + 30} maxWidth={560 - PLOT.x - 20} fontSize={12}>
          Above ceiling — deficit paid anaerobically
        </DiagramText>
      )}

      {/* Flow redistribution. */}
      <text className={styles.label} x={44} y={150}>
        Blood flow redistribution
      </text>
      {[
        { label: 'muscle', value: musclePct, color: 'var(--sarcomere)', text: `${derived.muscleFlowSharePct.toFixed(0)}%` },
        {
          label: 'other beds',
          value: clamp((100 - derived.muscleFlowSharePct - 8) / 70, 0.05, 1),
          color: 'var(--venous)',
          text: 'constricted',
        },
      ].map((row) => (
        <g key={row.label}>
          <text className={styles.caption} x={44} y={row.label === 'muscle' ? 168 : 196}>
            {row.label}
          </text>
          <rect className={styles.flowFrame} {...BAR(row.label === 'muscle' ? 174 : 202)} rx={3} />
          <rect
            className={styles.flowBar}
            x={44}
            y={row.label === 'muscle' ? 174 : 202}
            width={200 * row.value}
            height={15}
            fill={row.color}
            opacity={0.85}
          />
          <text className={styles.caption} x={250} y={(row.label === 'muscle' ? 186 : 214)}>
            {row.text}
          </text>
        </g>
      ))}

      <DiagramText className={styles.caption} x={44} y={258} maxWidth={500}>
        CO {derived.cardiacOutputLMin.toFixed(1)} L/min · a-v diff {derived.arteriovenousDiffMlDl.toFixed(1)} mL/dL · TPR{' '}
        {derived.totalResistanceIndex.toFixed(0)}
      </DiagramText>
      <DiagramText className={styles.caption} x={44} y={286} maxWidth={500}>
        VE {derived.ventilationLMin.toFixed(0)} L/min · core {derived.coreTempC.toFixed(1)} °C · fatigue{' '}
        {derived.fatiguePct.toFixed(0)}%
      </DiagramText>
      {(derived.aboveThreshold || derived.aboveVo2Max) && (
        <DiagramText className={styles.alarm} x={44} y={316} maxWidth={500} fontSize={12}>
          {derived.aboveVo2Max
            ? `Exhaustion — fatigue ${derived.fatiguePct.toFixed(0)}% and climbing`
            : `above lactate threshold (${(derived.lactateThresholdFraction * 100).toFixed(0)}% of ceiling)`}
        </DiagramText>
      )}

      <DiagramText className={styles.verdict} x={44} y={352} maxWidth={500} fontSize={15} tracking={0.04}>
        HR {derived.heartRateBpm.toFixed(0)} · lactate {derived.lactateMmolL.toFixed(1)} mmol/L
      </DiagramText>
      <DiagramText
        className={styles.caption}
        x={44}
        y={378}
        maxWidth={500}
        fontSize={11}
        tracking={0.06}
      >
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
