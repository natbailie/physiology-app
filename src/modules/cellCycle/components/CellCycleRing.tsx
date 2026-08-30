import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import type { CellCycleDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface CellCycleRingProps {
  derived: CellCycleDerived;
}

/** Laid out on the house 560x440 canvas so this module sits on the same card, at the same
 * size, as the other forty-five. */
const CENTER = { x: 280, y: 196 };
const RADIUS = 132;
const STROKE = 34;

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
  return { x: CENTER.x + RADIUS * Math.cos(rad), y: CENTER.y + RADIUS * Math.sin(rad) };
}

function arcPath(startFrac: number, endFrac: number): string {
  const start = polar(startFrac * 360);
  const end = polar(endFrac * 360);
  const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** The four-phase ring with a live marker at the cohort's current position, and the active
 * checkpoint named beneath it. Everything is read off the same state the engine advances. */
export function CellCycleRing({ derived }: CellCycleRingProps) {
  let acc = 0;

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
    <DiagramFrame
      viewBox="0 0 560 440"
      ariaLabel="Cell cycle ring showing the four phases, the cohort's current position and the active checkpoint"
    >
      {SEGMENTS.map((segment) => {
        const start = acc;
        acc += segment.fraction;
        return (
          <path
            key={segment.phase}
            d={arcPath(start, acc)}
            stroke={segment.colorVar}
            strokeWidth={derived.phase === segment.phase ? STROKE + 8 : STROKE}
            fill="none"
            opacity={derived.phase === segment.phase ? 1 : 0.35}
          />
        );
      })}

      {/* Phase names ride on their own arc, so the ring reads without a legend. */}
      {(() => {
        let walk = 0;
        return SEGMENTS.map((segment) => {
          const mid = polar((walk + segment.fraction / 2) * 360);
          walk += segment.fraction;
          const label = {
            x: CENTER.x + (mid.x - CENTER.x) * 1.34,
            y: CENTER.y + (mid.y - CENTER.y) * 1.34,
          };
          return (
            <text key={segment.phase} x={label.x} y={label.y + 4} className={styles.arcLabel}>
              {segment.phase}
            </text>
          );
        });
      })()}

      <circle cx={marker.x} cy={marker.y} r={9} className={styles.marker} />
      <text x={CENTER.x} y={CENTER.y - 6} textAnchor="middle" className={styles.phaseLabel}>
        {derived.phase}
      </text>
      <text x={CENTER.x} y={CENTER.y + 26} textAnchor="middle" className={styles.subLabel}>
        {derived.doublingTimeH < 9998 ? `${derived.doublingTimeH.toFixed(0)} h doubling` : 'not cycling'}
      </text>

      <text x={CENTER.x} y={396} textAnchor="middle" className={styles.verdict}>
        {arrested ? `Arrested — ${derived.arrestCause}` : 'Cycling'}
      </text>
    </DiagramFrame>
  );
}
