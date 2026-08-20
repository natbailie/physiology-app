import { useMemo, type CSSProperties } from 'react';
import styles from './OxygenDissociationCurve.module.css';

interface OxygenDissociationCurveProps {
  /** Maps an x-domain value to a y-domain value, e.g. saO2(paO2). */
  curveFn: (x: number) => number;
  currentX: number;
  currentY: number;
  xDomain: [number, number];
  yDomain: [number, number];
  colorVar: string;
  xLabel: string;
  yLabel: string;
  width?: number;
  height?: number;
  samples?: number;
}

function project(x: number, y: number, xDomain: [number, number], yDomain: [number, number], width: number, height: number) {
  const xRange = xDomain[1] - xDomain[0] || 1;
  const yRange = yDomain[1] - yDomain[0] || 1;
  const px = ((x - xDomain[0]) / xRange) * width;
  const py = height - ((y - yDomain[0]) / yRange) * height;
  return { px, py };
}

/** Generic XY reference-curve chart: a static curve sampled from `curveFn`, plus a live
 * dot showing the current (x, y) position on it — e.g. the O2-Hb dissociation curve. */
export function OxygenDissociationCurve({
  curveFn,
  currentX,
  currentY,
  xDomain,
  yDomain,
  colorVar,
  xLabel,
  yLabel,
  width = 220,
  height = 120,
  samples = 40,
}: OxygenDissociationCurveProps) {
  const curvePath = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = xDomain[0] + (i / samples) * (xDomain[1] - xDomain[0]);
      const y = curveFn(x);
      const { px, py } = project(x, y, xDomain, yDomain, width, height);
      points.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return points.join(' ');
  }, [curveFn, xDomain, yDomain, width, height, samples]);

  const dot = project(currentX, currentY, xDomain, yDomain, width, height);

  return (
    <div className={styles.wrap} style={{ '--chart-color': colorVar } as CSSProperties}>
      <div className={styles.header}>
        <span className="label">{yLabel} vs {xLabel}</span>
        <span className={styles.current}>
          {currentX.toFixed(0)} → {currentY.toFixed(0)}
        </span>
      </div>
      <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <path className={styles.curve} d={curvePath} />
        <circle className={styles.dot} cx={dot.px} cy={dot.py} r={3} />
      </svg>
    </div>
  );
}
