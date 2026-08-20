import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import { PANCREAS_PATH } from '@/shared/diagram/organShapes';

interface PancreasProps {
  x: number;
  y: number;
  /** CCK-driven enzyme/gallbladder signal, 0..1 */
  cckIntensity: number;
  /** Secretin-driven bicarbonate signal, 0..1 */
  secretinIntensity: number;
}

export function Pancreas({ x, y, cckIntensity, secretinIntensity }: PancreasProps) {
  const style = {
    '--cck-intensity': cckIntensity,
    '--secretin-intensity': secretinIntensity,
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.pancreasShape} d={PANCREAS_PATH} />
      <text className={styles.organLabel} y={26}>
        Pancreas
      </text>
    </g>
  );
}
