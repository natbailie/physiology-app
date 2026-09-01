import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface LungsProps {
  x: number;
  y: number;
  breathRate: number;
  ventDepth: number;
  /** 0-1. Drawn as lung units that are still being ventilated but no longer exchanging — the
   * structure behind a widened A-a gradient, and the thing a V/Q slider has to be visible AS. */
  vqMismatch: number;
}

const LUNG_PATH =
  'M0,-38 C18,-40 30,-14 28,14 C26,38 14,50 0,50 C-2,50 -4,49 -6,48 C-16,42 -24,26 -24,4 C-24,-20 -14,-38 0,-38 Z';

/** Positions of the alveolar units drawn inside each lung, in the lung path's own coordinates. */
const UNITS = [
  { x: -6, y: -22 },
  { x: 6, y: -6 },
  { x: -8, y: 6 },
  { x: 4, y: 20 },
  { x: -4, y: 34 },
];

export function Lungs({ x, y, breathRate, ventDepth, vqMismatch }: LungsProps) {
  const style = {
    '--breath-rate': breathRate,
    '--vent-depth': ventDepth,
  } as CSSProperties;
  // Which units have dropped out. Rounded so the count steps visibly as the slider moves rather
  // than fading, because a shunted alveolus is not a partly shunted one.
  const deadUnits = Math.round(vqMismatch * UNITS.length);

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.trachea} d="M0,-56 L0,-8" />
      <g className={styles.lungs}>
        <path className={styles.lungShape} d={LUNG_PATH} transform="translate(-20, 0)" />
        <path className={styles.lungShape} d={LUNG_PATH} transform="translate(20, 0) scale(-1, 1)" />
        {[-20, 20].map((side) =>
          UNITS.map((unit, index) => (
            <circle
              key={`${side}-${index}`}
              className={index < deadUnits ? styles.alveolusMismatched : styles.alveolus}
              cx={side + unit.x * (side < 0 ? 1 : -1)}
              cy={unit.y}
              r={4}
            />
          )),
        )}
      </g>
      <text className={styles.organLabel} y={66}>
        Lungs
      </text>
    </g>
  );
}
