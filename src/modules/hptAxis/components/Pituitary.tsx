import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import { PITUITARY_PATH } from '@/shared/diagram/organShapes';

interface PituitaryProps {
  x: number;
  y: number;
  tshIntensity: number;
}

export function Pituitary({ x, y, tshIntensity }: PituitaryProps) {
  const style = { '--tsh-intensity': tshIntensity } as CSSProperties;
  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.pituitaryShape} d={PITUITARY_PATH} />
      <text className={styles.organLabel} y={22}>
        Pituitary
      </text>
    </g>
  );
}
