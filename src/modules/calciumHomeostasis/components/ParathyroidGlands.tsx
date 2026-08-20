import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface ParathyroidGlandsProps {
  x: number;
  y: number;
  /** 0..1, PTH secretion level — brightens the glands */
  pthLevel: number;
}

/** The four parathyroid glands, drawn as small paired ovals on the posterior thyroid. */
export function ParathyroidGlands({ x, y, pthLevel }: ParathyroidGlandsProps) {
  const style = { '--pth-level': pthLevel } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <ellipse className={styles.parathyroidShape} cx={-9} cy={-8} rx={6} ry={5} />
      <ellipse className={styles.parathyroidShape} cx={9} cy={-8} rx={6} ry={5} />
      <ellipse className={styles.parathyroidShape} cx={-9} cy={7} rx={6} ry={5} />
      <ellipse className={styles.parathyroidShape} cx={9} cy={7} rx={6} ry={5} />
      <text className={styles.organLabel} y={28}>
        Parathyroids
      </text>
    </g>
  );
}
