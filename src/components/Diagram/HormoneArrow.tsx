import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface HormoneArrowProps {
  path: string;
  activation: number;
  colorVar: string;
  label: string;
  markerId: string;
  labelPos: { x: number; y: number };
}

/** A dashed, glowing pathway representing a hormonal feedback loop (RAAS or ANP). */
export function HormoneArrow({ path, activation, colorVar, label, markerId, labelPos }: HormoneArrowProps) {
  const style = { '--activation': activation, color: colorVar } as CSSProperties;
  return (
    <g style={style}>
      <path className={styles.hormoneArrow} d={path} stroke={colorVar} markerEnd={`url(#${markerId})`} />
      <text className={styles.pathLabel} x={labelPos.x} y={labelPos.y} fill={colorVar} opacity={activation}>
        {label}
      </text>
    </g>
  );
}
