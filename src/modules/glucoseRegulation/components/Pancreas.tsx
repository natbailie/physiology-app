import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import { PANCREAS_PATH } from '@/shared/diagram/organShapes';

interface PancreasProps {
  x: number;
  y: number;
  /** 0..~2, beta-cell insulin output */
  insulinLevel: number;
  /** 0..1, alpha-cell glucagon output */
  glucagonLevel: number;
}

/** The pancreas with its two reciprocal islet cell populations shown side by side — the beta
 * islet brightens with insulin, the alpha islet with glucagon, making the reciprocal
 * relationship directly visible. */
export function Pancreas({ x, y, insulinLevel, glucagonLevel }: PancreasProps) {
  const style = {
    '--insulin-level': Math.min(insulinLevel, 1),
    '--glucagon-level': glucagonLevel,
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.pancreasShape} d={PANCREAS_PATH} />
      <circle className={styles.betaIslet} cx={-12} cy={-3} r={7} />
      <circle className={styles.alphaIslet} cx={12} cy={-1} r={6} />
      <text className={styles.isletLabel} x={-12} y={-14}>
        β
      </text>
      <text className={styles.isletLabel} x={12} y={-12}>
        α
      </text>
      <text className={styles.organLabel} y={26}>
        Pancreas
      </text>
    </g>
  );
}
