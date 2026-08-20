import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import { HYPOTHALAMUS_PATH } from '@/shared/diagram/organShapes';

interface HypothalamusProps {
  x: number;
  y: number;
  crhIntensity: number;
}

export function Hypothalamus({ x, y, crhIntensity }: HypothalamusProps) {
  const style = { '--crh-intensity': crhIntensity } as CSSProperties;
  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.hypothalamusShape} d={HYPOTHALAMUS_PATH} />
      <text className={styles.organLabel} y={-24}>
        Hypothalamus
      </text>
    </g>
  );
}
