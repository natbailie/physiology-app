import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface HeartProps {
  x: number;
  y: number;
  effectiveHeartRate: number;
  strokeVolumeScale: number;
}

const HEART_PATH =
  'M0,-12 C-16,-28 -40,-12 -40,8 C-40,28 -16,36 0,48 C16,36 40,28 40,8 C40,-12 16,-28 0,-12 Z';

export function Heart({ x, y, effectiveHeartRate, strokeVolumeScale }: HeartProps) {
  const style = {
    '--hr-bpm': effectiveHeartRate,
    '--sv-scale': strokeVolumeScale,
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <g className={styles.heart}>
        <path className={styles.heartShape} d={HEART_PATH} />
      </g>
      <text className={styles.organLabel} y={68}>
        Heart
      </text>
    </g>
  );
}
