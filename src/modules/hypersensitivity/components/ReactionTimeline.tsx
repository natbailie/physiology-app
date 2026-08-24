import { useMemo } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { HypersensitivityDerived, HypersensitivityHistoryPoint } from '../engine/types';

interface ReactionTimelineProps {
  derived: HypersensitivityDerived;
  history: HypersensitivityHistoryPoint[];
}

const PLOT = { left: 46, right: 452, top: 40, bottom: 196 };

/** Ten minutes to four days. A linear axis cannot hold both ends of that. */
const MIN_HOURS = 0.1;
const MAX_HOURS = 120;

const TICKS: { hours: number; label: string }[] = [
  { hours: 0.17, label: '10 min' },
  { hours: 0.5, label: '30 min' },
  { hours: 1, label: '1 h' },
  { hours: 6, label: '6 h' },
  { hours: 24, label: '1 day' },
  { hours: 72, label: '3 days' },
];

const ARMS = [
  { key: 'typeI', label: 'I · mast cell', className: styles.armTypeI, colorVar: 'var(--ige)' },
  { key: 'typeII', label: 'II · anti-cell Ab', className: styles.armTypeII, colorVar: 'var(--cytotoxic-ab)' },
  { key: 'typeIII', label: 'III · complexes', className: styles.armTypeIII, colorVar: 'var(--immune-complex)' },
  { key: 'typeIV', label: 'IV · T cell', className: styles.armTypeIV, colorVar: 'var(--delayed-type)' },
] as const;

const LOG_MIN = Math.log10(MIN_HOURS);
const LOG_MAX = Math.log10(MAX_HOURS);

function projectX(hours: number): number {
  const t = (Math.log10(clamp(hours, MIN_HOURS, MAX_HOURS)) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return PLOT.left + t * (PLOT.right - PLOT.left);
}

function projectY(activity: number): number {
  return PLOT.bottom - clamp(activity, 0, 1) * (PLOT.bottom - PLOT.top);
}

/**
 * The four arms plotted against time since the challenge, on a LOGARITHMIC axis.
 *
 * The axis is the whole design. A type I reaction peaks at fifteen minutes and a type IV at
 * seventy-two hours — three orders of magnitude apart — and no linear axis can show both: at a
 * scale where the tuberculin response is visible, anaphylaxis is a vertical line at the origin.
 * Compressing the axis logarithmically is the only way to put the comparison in one picture,
 * and that comparison is what the module exists to teach. Onset time is also the first thing
 * asked about a real reaction, precisely because the four effectors are physically incapable
 * of working at each other's speeds.
 */
export function ReactionTimeline({ derived, history }: ReactionTimelineProps) {
  const challenged = history.filter((point) => point.hoursSinceChallenge > 0);

  const paths = useMemo(() => {
    return ARMS.map((arm) => ({
      ...arm,
      d: challenged
        .map((point, index) => {
          const x = projectX(point.hoursSinceChallenge);
          const y = projectY(point[arm.key]);
          return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' '),
    }));
  }, [challenged]);

  const running = derived.hoursSinceChallenge >= 0;
  const nowX = running ? projectX(Math.max(derived.hoursSinceChallenge, MIN_HOURS)) : null;

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel={`Reaction timeline on a logarithmic time axis showing the activity of all four hypersensitivity arms since the challenge. ${derived.mechanismSummary}`}
    >
      {/* A tier above the sliding "now" label, which occupies PLOT.top - 18 across the full width. */}
      <text className={styles.pathLabel} x={22} y={11}>
        Reaction timeline · log time since challenge
      </text>

      {[0, 0.5, 1].map((level) => {
        const y = projectY(level);
        return (
          <g key={level}>
            <line className={styles.plotGrid} x1={PLOT.left} y1={y} x2={PLOT.right} y2={y} />
            <text className={styles.axisLabel} x={PLOT.left - 14} y={y + 3}>
              {Math.round(level * 100)}
            </text>
          </g>
        );
      })}

      {TICKS.map((tick) => {
        const x = projectX(tick.hours);
        return (
          <g key={tick.label}>
            <line className={styles.plotGrid} x1={x} y1={PLOT.top} x2={x} y2={PLOT.bottom} />
            <text className={styles.axisLabel} x={x} y={PLOT.bottom + 14}>
              {tick.label}
            </text>
          </g>
        );
      })}

      <line className={styles.plotAxis} x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} />
      <line className={styles.plotAxis} x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={PLOT.bottom} />
      <text className={styles.axisLabel} x={PLOT.left - 26} y={PLOT.top + 6}>
        %
      </text>

      {/* Where each mechanism is physically capable of acting — the reason onset time is the
          first question asked about a reaction. */}
      <text className={styles.bandLabel} x={projectX(0.3)} y={PLOT.top - 6} fill="var(--ige)">
        minutes
      </text>
      <text className={styles.bandLabel} x={projectX(4)} y={PLOT.top - 6} fill="var(--cytotoxic-ab)">
        hours
      </text>
      <text className={styles.bandLabel} x={projectX(50)} y={PLOT.top - 6} fill="var(--delayed-type)">
        days
      </text>

      {paths.map((arm) => arm.d && <path key={arm.key} className={arm.className} d={arm.d} />)}

      {nowX !== null && (
        <>
          <line className={styles.nowMarker} x1={nowX} y1={PLOT.top} x2={nowX} y2={PLOT.bottom} />
          <text className={styles.nowLabel} x={nowX} y={PLOT.top - 18}>
            {derived.hoursSinceChallenge < 1
              ? `${Math.round(derived.hoursSinceChallenge * 60)} min`
              : `${derived.hoursSinceChallenge.toFixed(0)} h`}
          </text>
        </>
      )}

      {ARMS.map((arm, index) => (
        <g key={arm.key}>
          <line
            x1={26 + index * 116}
            y1={228}
            x2={44 + index * 116}
            y2={228}
            stroke={arm.colorVar}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <text className={styles.legendLabel} x={48 + index * 116} y={231}>
            {arm.label}
          </text>
        </g>
      ))}

      <text className={styles.verdict} x={22} y={258}>
        {derived.mechanismSummary}
      </text>
      <text className={styles.valueLabel} x={22} y={276}>
        injury {(derived.tissueInjury * 100).toFixed(0)}% · peak {(derived.peakInjury * 100).toFixed(0)}% · temp{' '}
        {derived.temperatureC.toFixed(1)}&deg;C · MAP {derived.meanArterialPressureMmHg.toFixed(0)} mmHg
      </text>
      <text className={styles.valueLabel} x={22} y={292}>
        tryptase {derived.tryptaseNgMl.toFixed(0)} · C3 {derived.c3MgDl.toFixed(0)} · C4 {derived.c4MgDl.toFixed(0)} ·
        Coombs {derived.directCoombs > 0.25 ? 'positive' : 'negative'}
      </text>
    </DiagramFrame>
  );
}
