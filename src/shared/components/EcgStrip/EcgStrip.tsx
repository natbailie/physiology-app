import { memo, useMemo, type CSSProperties } from 'react';
import styles from './EcgStrip.module.css';

interface EcgStripProps {
  label: string;
  /** Voltage samples in mV, oldest first. */
  data: number[];
  /** Half-height of the visible voltage window, mV — the trace clips beyond ±this. */
  mvRange: number;
  colorVar: string;
  /** Name of the wave/segment currently being inscribed, shown as a live annotation. */
  currentSegment?: string;
  width?: number;
  height?: number;
}

const GRID_ID_PREFIX = 'ecg-grid';

function buildPath(data: number[], mvRange: number, width: number, height: number): string {
  if (data.length < 2) return '';
  const mid = height / 2;
  return data
    .map((mv, i) => {
      const x = (i / (data.length - 1)) * width;
      // Positive voltage deflects UP, so y is inverted.
      const clamped = Math.max(-mvRange, Math.min(mvRange, mv));
      const y = mid - (clamped / mvRange) * mid;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/**
 * A scrolling ECG trace on an ECG-paper grid, with the newest sample at the right edge and a
 * bright leading dot marking where the trace is currently being written.
 *
 * Distinct from `Sparkline`, which is a short area-filled line for slow trends: an ECG needs
 * a tall unfilled trace with a baseline through the middle so deflections read above and
 * below isoelectric, plus the familiar grid for judging interval widths by eye.
 */
function EcgStripBase({ label, data, mvRange, colorVar, currentSegment, width = 260, height = 120 }: EcgStripProps) {
  const linePath = useMemo(() => buildPath(data, mvRange, width, height), [data, mvRange, width, height]);
  const gridId = useMemo(() => `${GRID_ID_PREFIX}-${Math.round(width)}x${Math.round(height)}`, [width, height]);

  const latest = data.at(-1);
  const mid = height / 2;
  const latestY = latest === undefined ? mid : mid - (Math.max(-mvRange, Math.min(mvRange, latest)) / mvRange) * mid;

  return (
    <div className={styles.wrap} style={{ '--chart-color': colorVar } as CSSProperties}>
      <div className={styles.header}>
        <span className="label">{label}</span>
        {currentSegment && <span className={styles.segment}>{currentSegment}</span>}
      </div>
      <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${label} trace`}>
        <defs>
          {/* ECG paper: fine squares with a heavier line every fifth. */}
          <pattern id={gridId} width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M10,0 L0,0 L0,10" className={styles.gridFine} />
          </pattern>
          <pattern id={`${gridId}-major`} width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill={`url(#${gridId})`} />
            <path d="M50,0 L0,0 L0,50" className={styles.gridMajor} />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#${gridId}-major)`} />
        <line className={styles.baseline} x1={0} y1={mid} x2={width} y2={mid} />
        {linePath && <path className={styles.trace} d={linePath} />}
        {latest !== undefined && data.length > 1 && <circle className={styles.leadingDot} cx={width} cy={latestY} r={3} />}
      </svg>
    </div>
  );
}

export const EcgStrip = memo(EcgStripBase);
