import type { CSSProperties } from 'react';
import styles from './HormoneArrow.module.css';

interface HormoneArrowProps {
  path: string;
  activation: number;
  colorVar: string;
  label: string;
  markerId: string;
  labelPos: { x: number; y: number };
  /** Renders a tighter, dotted dash pattern to visually distinguish an inhibitory/negative-feedback
   * pathway (e.g. cortisol → hypothalamus) from a stimulatory one. Purely a stroke-pattern change —
   * the caller still supplies its own marker id/shape via `markerId`. */
  inhibitory?: boolean;
}

/** A dashed, glowing pathway representing a hormonal feedback loop (e.g. RAAS, ANP, chemoreceptor drive). */
export function HormoneArrow({ path, activation, colorVar, label, markerId, labelPos, inhibitory }: HormoneArrowProps) {
  const style = { '--activation': activation, color: colorVar } as CSSProperties;
  const arrowClassName = inhibitory ? `${styles.hormoneArrow} ${styles.inhibitory}` : styles.hormoneArrow;
  return (
    <g style={style}>
      <path className={arrowClassName} d={path} stroke={colorVar} markerEnd={`url(#${markerId})`} />
      <text className={styles.pathLabel} x={labelPos.x} y={labelPos.y} fill={colorVar} opacity={0.35 + activation * 0.65}>
        {label}
      </text>
    </g>
  );
}
