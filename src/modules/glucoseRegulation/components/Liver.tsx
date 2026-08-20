import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import { LIVER_PATH } from '@/shared/diagram/organShapes';

interface LiverProps {
  x: number;
  y: number;
  /** 0..1, remaining hepatic glycogen store */
  glycogenReserve: number;
  /** 0..1 normalized, current glycogenolysis/glucose output activity */
  hepaticOutput: number;
}

// Liver shape spans roughly y=-26..26; the glycogen level fills upward from the base.
const LIVER_TOP = -26;
const LIVER_BOTTOM = 26;
const LIVER_HEIGHT = LIVER_BOTTOM - LIVER_TOP;

/** The liver, with its glycogen reserve drawn as a fill level rising from the base — it
 * visibly drains during sustained glycogenolysis and refills once glucose is adequate. */
export function Liver({ x, y, glycogenReserve, hepaticOutput }: LiverProps) {
  const style = { '--hepatic-output': hepaticOutput } as CSSProperties;
  const fillHeight = LIVER_HEIGHT * glycogenReserve;
  const clipId = `liver-glycogen-clip-${Math.round(x)}-${Math.round(y)}`;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <clipPath id={clipId}>
        <path d={LIVER_PATH} />
      </clipPath>
      <path className={styles.liverShape} d={LIVER_PATH} />
      <rect className={styles.glycogenFill} clipPath={`url(#${clipId})`} x={-42} y={LIVER_BOTTOM - fillHeight} width={84} height={fillHeight} />
      <text className={styles.organLabel} y={44}>
        Liver
      </text>
    </g>
  );
}
