import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import { KIDNEY_PATH } from '@/shared/diagram/organShapes';

interface RenalCompensationOrganProps {
  x: number;
  y: number;
  hco3Intensity: number;
}

/** The kidneys' role in this module: slow renal bicarbonate compensation, not
 * filtration/GFR — a separate component from the cardiorenal module's Kidneys so the
 * two modules' visuals stay decoupled even though they share the same organ shape. */
export function RenalCompensationOrgan({ x, y, hco3Intensity }: RenalCompensationOrganProps) {
  const style = { '--hco3-intensity': hco3Intensity } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <g transform="translate(0, -22)">
        <path className={styles.kidneyShape} d={KIDNEY_PATH} />
      </g>
      <g transform="translate(0, 24) scale(-1, 1)">
        <path className={styles.kidneyShape} d={KIDNEY_PATH} />
      </g>
      <text className={styles.organLabel} y={54}>
        Kidneys
      </text>
    </g>
  );
}
