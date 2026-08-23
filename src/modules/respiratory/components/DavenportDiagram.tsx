import { useMemo } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { RespDerived, RespHistoryPoint } from '../engine/types';

interface DavenportDiagramProps {
  derived: RespDerived;
  history: RespHistoryPoint[];
  baselineHistory: RespHistoryPoint[] | null;
}

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

const ISOPLETH_PATHS = ISOPLETHS.map((paCO2) => ({ paCO2, d: isoplethPath(paCO2) }));
const BUFFER_LINE = bufferLinePath();

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

/**
 * The Davenport diagram: plasma bicarbonate against pH, with lines of constant PaCO2 running
 * across it.
 *
 * Its whole value is that it separates the two halves of an acid-base disturbance into two
 * directions on one picture. A purely respiratory change slides the patient ALONG the buffer
 * line and across the isopleths; a purely metabolic one moves them vertically off it while
 * staying on the same isopleth. A patient who has moved in both directions at once has two
 * disorders, and you can see that at a glance long before you can compute it — which is why
 * the mixed presets are the ones worth watching here.
 */
export function DavenportDiagram({ derived, history, baselineHistory }: DavenportDiagramProps) {
  const trailPath = useMemo(() => toPath(history), [history]);
  const baselinePath = useMemo(() => (baselineHistory ? toPath(baselineHistory) : ''), [baselineHistory]);

  const live = project(derived.pH, derived.plasmaHCO3);
  const normal = project(7.4, 24);
  const mixed = derived.interpretation.isMixed;

  return (
    <DiagramFrame
      viewBox="0 0 480 260"
      ariaLabel={`Davenport diagram: plasma bicarbonate ${derived.plasmaHCO3.toFixed(0)} mEq/L plotted against pH ${derived.pH.toFixed(2)}, on lines of constant PaCO2. Current interpretation: ${derived.interpretation.label}`}
    >
      <text className={styles.pathLabel} x={22} y={20}>
        Bicarbonate vs pH, on lines of constant PaCO2
      </text>

      {HCO3_TICKS.map((hco3) => {
        const { y } = project(PH_MIN, hco3);
        return (
          <g key={`h-${hco3}`}>
            <line className={styles.plotGrid} x1={PLOT.left} y1={y} x2={PLOT.right} y2={y} />
            <text className={styles.axisLabel} x={PLOT.left - 12} y={y + 3}>
              {hco3}
            </text>
          </g>
        );
      })}
      {PH_TICKS.map((pH) => {
        const { x } = project(pH, HCO3_MIN);
        return (
          <text key={`p-${pH}`} className={styles.axisLabel} x={x} y={PLOT.bottom + 13}>
            {pH.toFixed(1)}
          </text>
        );
      })}

      {ISOPLETH_PATHS.map(({ paCO2, d }) => {
        const label = isoplethLabelPoint(paCO2);
        return (
          <g key={paCO2}>
            <path className={styles.isopleth} d={d} />
            <text className={styles.isoplethLabel} x={label.x} y={label.y - 3}>
              {paCO2}
            </text>
          </g>
        );
      })}

      <path className={styles.bufferLine} d={BUFFER_LINE} />

      <line className={styles.plotAxis} x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} />
      <line className={styles.plotAxis} x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={PLOT.bottom} />
      <text className={styles.axisLabel} x={PLOT.left - 34} y={PLOT.top + 6}>
        mEq/L
      </text>
      <text className={styles.axisLabel} x={(PLOT.left + PLOT.right) / 2} y={PLOT.bottom + 26}>
        pH
      </text>

      {/* Which way is which. Bicarbonate runs up the page and pH across it, so the four
          disorders land in the four corners: a HIGH bicarbonate with an ACID pH can only be a
          respiratory acidosis the kidney has answered, while a high bicarbonate with an
          alkaline pH is the metabolic alkalosis causing it. Reading the corner is the
          diagnosis, which is the entire reason to draw the plot this way round. */}
      <text className={styles.regionLabel} x={PLOT.left + 64} y={PLOT.top + 34}>
        respiratory acidosis
      </text>
      <text className={styles.regionLabel} x={PLOT.right - 62} y={PLOT.top + 34}>
        metabolic alkalosis
      </text>
      <text className={styles.regionLabel} x={PLOT.left + 62} y={PLOT.bottom - 10}>
        metabolic acidosis
      </text>
      <text className={styles.regionLabel} x={PLOT.right - 64} y={PLOT.bottom - 10}>
        respiratory alkalosis
      </text>

      <circle className={styles.normalPoint} cx={normal.x} cy={normal.y} r={4} />

      {baselinePath && <path className={styles.baselineTrail} d={baselinePath} />}
      {history.length > 1 && <path className={styles.trail} d={trailPath} />}
      <circle className={styles.livePoint} cx={live.x} cy={live.y} r={4.5} />

      <text className={mixed ? styles.verdictMixed : styles.verdict} x={22} y={238}>
        {derived.interpretation.label}
      </text>
      <text className={styles.pathLabel} x={22} y={252}>
        pH {derived.pH.toFixed(2)} · PaCO2 {derived.paCO2.toFixed(0)} · HCO3 {derived.plasmaHCO3.toFixed(0)} · gap{' '}
        {derived.anionGapMEqL.toFixed(0)}
        {derived.deltaRatio !== 0 ? ` · delta ratio ${derived.deltaRatio.toFixed(1)}` : ''}
      </text>
    </DiagramFrame>
  );
}
