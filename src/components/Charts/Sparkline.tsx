import { useMemo, type CSSProperties } from 'react';
import styles from './Sparkline.module.css';

interface SparklineProps {
  label: string;
  unit?: string;
  data: number[];
  domainMin: number;
  domainMax: number;
  colorVar: string;
  width?: number;
  height?: number;
}

function buildPath(data: number[], domainMin: number, domainMax: number, width: number, height: number): string {
  if (data.length < 2) return '';
  const range = domainMax - domainMin || 1;
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const t = Math.min(1, Math.max(0, (v - domainMin) / range));
      const y = height - t * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Fixed-domain SVG line chart. Domains are physiologically-anchored, not auto-scaled to
 * the visible data, so a small clinically-meaningful deviation doesn't get exaggerated
 * (or a large one hidden) by rescaling the axis. */
export function Sparkline({ label, unit, data, domainMin, domainMax, colorVar, width = 220, height = 46 }: SparklineProps) {
  const linePath = useMemo(() => buildPath(data, domainMin, domainMax, width, height), [data, domainMin, domainMax, width, height]);
  const areaPath = linePath ? `${linePath} L${width},${height} L0,${height} Z` : '';
  const current = data.at(-1);

  const range = domainMax - domainMin || 1;
  const lastX = width;
  const lastT = current !== undefined ? Math.min(1, Math.max(0, (current - domainMin) / range)) : 0;
  const lastY = height - lastT * height;

  return (
    <div className={styles.wrap} style={{ '--chart-color': colorVar } as CSSProperties}>
      <div className={styles.header}>
        <span className="label">{label}</span>
        <span className={styles.current}>
          {current !== undefined ? current.toFixed(0) : '--'}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {areaPath && <path className={styles.area} d={areaPath} />}
        {linePath && <path className={styles.line} d={linePath} />}
        {current !== undefined && <circle className={styles.dot} cx={lastX} cy={lastY} r={2.25} />}
      </svg>
    </div>
  );
}
