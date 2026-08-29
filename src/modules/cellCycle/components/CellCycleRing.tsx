import type { CellCycleDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface CellCycleRingProps {
  derived: CellCycleDerived;
}

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 96;
const STROKE = 26;

/** Arc geometry for each phase, drawn clockwise from the top. G1 dominates the circle the
 * way it dominates real time. */
const SEGMENTS: { phase: string; fraction: number; colorVar: string }[] = [
  { phase: 'G1', fraction: 11 / 24, colorVar: 'var(--conduction-path)' },
  { phase: 'S', fraction: 8 / 24, colorVar: 'var(--o2)' },
  { phase: 'G2', fraction: 4 / 24, colorVar: 'var(--repolarizing)' },
  { phase: 'M', fraction: 1 / 24, colorVar: 'var(--danger)' },
];

function polar(angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + RADIUS * Math.cos(rad), y: CENTER + RADIUS * Math.sin(rad) };
}

function arcPath(startFrac: number, endFrac: number): string {
  const start = polar(startFrac * 360);
  const end = polar(endFrac * 360);
  const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** The four-phase ring with a live marker at the cohort's current position, and the active
 * checkpoint badge lit. Everything is read off the same state the engine advances. */
export function CellCycleRing({ derived }: CellCycleRingProps) {
  let acc = 0;
  const markerAngle = SEGMENTS.slice(0, SEGMENTS.findIndex((s) => s.phase === derived.phase)).reduce((sum, s) => sum + s.fraction, 0);
  void markerAngle;

  // Marker angle: walk cumulative fractions to find where progress sits.
  let walked = 0;
  let angle = 0;
  for (const segment of SEGMENTS) {
    if (segment.phase === derived.phase) {
      angle = (walked + segment.fraction * derived.phaseProgress) * 360;
      break;
    }
    walked += segment.fraction;
  }
  const marker = polar(angle);

  const arrested = derived.arrestCause !== 'none';

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.ring} role="img" aria-label="Cell cycle position">
        {SEGMENTS.map((segment) => {
          const start = acc;
          acc += segment.fraction;
          return (
            <path
              key={segment.phase}
              d={arcPath(start, acc)}
              stroke={segment.colorVar}
              strokeWidth={derived.phase === segment.phase ? STROKE + 6 : STROKE}
              fill="none"
              opacity={derived.phase === segment.phase ? 1 : 0.35}
            />
          );
        })}
        <circle cx={marker.x} cy={marker.y} r={7} className={styles.marker} />
        <text x={CENTER} y={CENTER - 8} textAnchor="middle" className={styles.phaseLabel}>
          {derived.phase}
        </text>
        <text x={CENTER} y={CENTER + 14} textAnchor="middle" className={styles.subLabel}>
          {arrested ? 'ARRESTED' : `${derived.doublingTimeH < 9998 ? `${derived.doublingTimeH.toFixed(0)} h doubling` : ''}`}
        </text>
      </svg>
      <div className={arrested ? styles.badgeActive : styles.badge}>{derived.arrestCause}</div>
    </div>
  );
}
