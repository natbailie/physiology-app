import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import { KIDNEY_PATH } from '@/shared/diagram/organShapes';

interface KidneysProps {
  x: number;
  y: number;
  gfrIntensity: number;
  urineSpeed: number;
}

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
