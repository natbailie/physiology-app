import { memo, useMemo, type CSSProperties } from 'react';
import { useModuleShell } from '@/shared/context/moduleShell';
import styles from './Sparkline.module.css';

interface SparklineProps {
  label: string;
  unit?: string;
  data: number[];
  domainMin: number;
  domainMax: number;
  colorVar: string;
  /** Optional second series on the SAME axes, drawn dashed. Use only where the comparison is
   * the point — two quantities that are routinely confused with one another. */
  secondaryData?: number[];
  secondaryLabel?: string;
  secondaryColorVar?: string;
  /** Frozen earlier run of THIS series, drawn faint behind the live trace so a
   * changed scenario can be read against the one it replaced. */
  baselineData?: number[] | null;
  /** The same, for the secondary series. Without it, freezing a baseline on a two-series
   * chart silently compares only half of the comparison the chart exists to make. */
  secondaryBaselineData?: number[] | null;
  width?: number;
  height?: number;
  /**
   * Points the frame is sized for — the engine's `historyCapacity`. Without it a trace is stretched
   * across the whole frame however few points it has, so a chart that is still filling draws a
   * two-point line corner to corner and then compresses leftwards on every tick. Modules that open
   * settled are seeded to capacity and never see it; the ones whose baseline is a trajectory, and
   * so have no resting state to record, are exactly the ones that need this.
   */
  capacity?: number;
}

function buildPath(
  data: number[],
  domainMin: number,
  domainMax: number,
  width: number,
  height: number,
  span: number,
): string {
  if (data.length < 2) return '';
  const range = domainMax - domainMin || 1;
  return data
    .map((v, i) => {
      const x = (i / span) * width;
      const t = Math.min(1, Math.max(0, (v - domainMin) / range));
      const y = height - t * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Fixed-domain SVG line chart. Domains are physiologically-anchored, not auto-scaled to
 * the visible data, so a small clinically-meaningful deviation doesn't get exaggerated
 * (or a large one hidden) by rescaling the axis. */
function SparklineBase({
  label,
  unit,
  data,
  domainMin,
  domainMax,
  colorVar,
  secondaryData,
  secondaryLabel,
  secondaryColorVar,
  baselineData,
  secondaryBaselineData,
  width = 220,
  height = 46,
  capacity,
}: SparklineProps) {
  // The divisor every series is drawn against. The shell carries the engine's own capacity, so a
  // chart is sized for the trace it will eventually hold rather than for the points it has now.
  // Falling back to the live series' own length is what every chart did before capacity existed,
  // and keeps a caller outside a module page — the diagram audit, a unit test — unchanged.
  const shell = useModuleShell();
  const span = Math.max(1, (capacity ?? shell.historyCapacity ?? data.length) - 1);
  const linePath = useMemo(() => buildPath(data, domainMin, domainMax, width, height, span), [data, domainMin, domainMax, width, height, span]);
  const secondaryPath = useMemo(
    () => (secondaryData ? buildPath(secondaryData, domainMin, domainMax, width, height, span) : ''),
    [secondaryData, domainMin, domainMax, width, height, span],
  );
  const baselinePath = useMemo(
    () => (baselineData && baselineData.length > 1 ? buildPath(baselineData, domainMin, domainMax, width, height, span) : ''),
    [baselineData, domainMin, domainMax, width, height, span],
  );
  const secondaryBaselinePath = useMemo(
    () =>
      secondaryBaselineData && secondaryBaselineData.length > 1
        ? buildPath(secondaryBaselineData, domainMin, domainMax, width, height, span)
        : '',
    [secondaryBaselineData, domainMin, domainMax, width, height, span],
  );
  const range = domainMax - domainMin || 1;
  const current = data.at(-1);
  // The trace's own right-hand edge, which is the frame's only once the buffer is full. The area
  // fill and the end dot both have to close there rather than at `width`, or a half-filled chart
  // paints a slab of colour under empty space and hangs its dot off the frame's right edge.
  const lastX = (Math.max(0, data.length - 1) / span) * width;
  const areaPath = linePath ? `${linePath} L${lastX.toFixed(1)},${height} L0,${height} Z` : '';
  const lastT = current !== undefined ? Math.min(1, Math.max(0, (current - domainMin) / range)) : 0;
  const lastY = height - lastT * height;

  return (
    <div
      className={styles.wrap}
      style={{ '--chart-color': colorVar, '--secondary-color': secondaryColorVar ?? colorVar } as CSSProperties}
    >
      <div className={styles.header}>
        <span className="label">
          {label}
          {secondaryLabel ? ` vs ${secondaryLabel}` : ''}
        </span>
        <span className={styles.current}>
          {current !== undefined ? current.toFixed(0) : '--'}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <svg className={styles.svg} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {areaPath && <path className={styles.area} d={areaPath} />}
        {baselinePath && <path className={styles.baselineLine} d={baselinePath} />}
        {secondaryBaselinePath && <path className={styles.baselineLine} d={secondaryBaselinePath} />}
        {secondaryPath && <path className={styles.secondaryLine} d={secondaryPath} />}
        {linePath && <path className={styles.line} d={linePath} />}
        {current !== undefined && <circle className={styles.dot} cx={lastX} cy={lastY} r={2.25} />}
      </svg>
    </div>
  );
}

export const Sparkline = memo(SparklineBase);
