import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import { SMALL_INTESTINE_PATH } from '@/shared/diagram/organShapes';

interface SmallIntestineProps {
  x: number;
  y: number;
  /** 0..1, secretin-driven pancreatic bicarbonate neutralization */
  bicarbIntensity: number;
  /** Peristalsis/MMC intensity — drives the animation speed */
  motility: number;
}

export function SmallIntestine({ x, y, bicarbIntensity, motility }: SmallIntestineProps) {
  const style = {
    '--bicarb-intensity': bicarbIntensity,
    '--motility-intensity': motility,
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.intestineShape} d={SMALL_INTESTINE_PATH} />
      <text className={styles.organLabel} y={40}>
        Small intestine
      </text>
    </g>
  );
}
