import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import { STOMACH_PATH } from '@/shared/diagram/organShapes';

interface StomachProps {
  x: number;
  y: number;
  /** 0..1, higher = more acidic (lower pH) */
  acidIntensity: number;
  /** 0..1, how full the stomach currently is */
  volumeFraction: number;
}

export function Stomach({ x, y, acidIntensity, volumeFraction }: StomachProps) {
  const style = {
    '--acid-intensity': acidIntensity,
    '--stomach-volume': volumeFraction,
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.stomachShape} d={STOMACH_PATH} />
      <text className={styles.organLabel} y={54}>
        Stomach
      </text>
    </g>
  );
}
