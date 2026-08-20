import type { CSSProperties } from 'react';
import styles from './XYTrajectoryChart.module.css';

export interface TrajectoryPoint {
  x: number;
  y: number;
}

interface XYTrajectoryChartProps {
  /** Recent trajectory history, oldest first. Rendered as a fading trail. */
  points: TrajectoryPoint[];
  currentPoint: TrajectoryPoint;
  xDomain: [number, number];
  yDomain: [number, number];
  colorVar: string;
  xLabel: string;
  yLabel: string;
  /** Optional static reference lines drawn beneath the trajectory (e.g. an ESPVR line). */
  referencePaths?: { d: string; label?: string }[];
  width?: number;
  height?: number;
}

function project(point: TrajectoryPoint, xDomain: [number, number], yDomain: [number, number], width: number, height: number) {
  const xRange = xDomain[1] - xDomain[0] || 1;
  const yRange = yDomain[1] - yDomain[0] || 1;
  return {
    px: ((point.x - xDomain[0]) / xRange) * width,
    py: height - ((point.y - yDomain[0]) / yRange) * height,
  };
}

/**
 * Generic XY trajectory chart: plots a path traced through a two-variable state space, with a
 * bright leading dot at the current position. Where `OxygenDissociationCurve` shows a single
 * point moving along a FIXED curve, this draws the curve the system is actually tracing — so
 * it suits closed cyclic loops (a pressure-volume loop, a flow-volume loop) where the shape
 * of the path is itself the thing being taught.
 */
export function XYTrajectoryChart({
  points,
  currentPoint,
  xDomain,
  yDomain,
  colorVar,
  xLabel,
  yLabel,
  referencePaths,
  width = 220,
  height = 150,
}: XYTrajectoryChartProps) {
  const trajectoryPath = points
    .map((point, index) => {
      const { px, py } = project(point, xDomain, yDomain, width, height);
      return `${index === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');

  const dot = project(currentPoint, xDomain, yDomain, width, height);

  return (
    <div className={styles.wrap} style={{ '--chart-color': colorVar } as CSSProperties}>
      <div className={styles.header}>
        <span className="label">
          {yLabel} vs {xLabel}
        </span>
        <span className={styles.current}>
          {currentPoint.x.toFixed(0)} / {currentPoint.y.toFixed(0)}
        </span>
      </div>
      <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {referencePaths?.map((reference) => (
          <path key={reference.d} className={styles.reference} d={reference.d} />
        ))}
        {points.length > 1 && <path className={styles.trajectory} d={trajectoryPath} />}
        <circle className={styles.dot} cx={dot.px} cy={dot.py} r={3.5} />
      </svg>
    </div>
  );
}
