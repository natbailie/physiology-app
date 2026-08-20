import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface LungsProps {
  x: number;
  y: number;
  breathRate: number;
  ventDepth: number;
}

const LUNG_PATH =
  'M0,-38 C18,-40 30,-14 28,14 C26,38 14,50 0,50 C-2,50 -4,49 -6,48 C-16,42 -24,26 -24,4 C-24,-20 -14,-38 0,-38 Z';

export function Lungs({ x, y, breathRate, ventDepth }: LungsProps) {
  const style = {
    '--breath-rate': breathRate,
    '--vent-depth': ventDepth,
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.trachea} d="M0,-56 L0,-8" />
      <g className={styles.lungs}>
        <path className={styles.lungShape} d={LUNG_PATH} transform="translate(-20, 0)" />
        <path className={styles.lungShape} d={LUNG_PATH} transform="translate(20, 0) scale(-1, 1)" />
      </g>
      <text className={styles.organLabel} y={66}>
        Lungs
      </text>
    </g>
  );
}
