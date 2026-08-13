import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface KidneysProps {
  x: number;
  y: number;
  gfrIntensity: number;
  urineSpeed: number;
}

const KIDNEY_PATH =
  'M-8,-32 C10,-36 24,-22 22,-4 C21,6 10,4 6,13 C2,21 10,26 18,24 C26,34 14,44 -2,42 C-20,39 -26,18 -22,-2 C-19,-20 -18,-28 -8,-32 Z';

export function Kidneys({ x, y, gfrIntensity, urineSpeed }: KidneysProps) {
  const style = {
    '--gfr-intensity': gfrIntensity,
    '--urine-speed': urineSpeed,
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <g transform="translate(0, -22)">
        <path className={styles.kidneyShape} d={KIDNEY_PATH} />
      </g>
      <g transform="translate(0, 24) scale(-1, 1)">
        <path className={styles.kidneyShape} d={KIDNEY_PATH} />
      </g>

      {/* urine output indicator */}
      <path className={styles.urineFlow} d="M0,68 L0,96" />
      <text className={styles.pathLabel} x={14} y={90}>
        urine
      </text>

      <text className={styles.organLabel} y={112}>
        Kidneys
      </text>
    </g>
  );
}
