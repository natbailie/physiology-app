import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface AdrenalGlandProps {
  x: number;
  y: number;
  cortisolIntensity: number;
  adrenalReserve: number;
}

const ADRENAL_PATH = 'M-10,4 C-11,-6 -3,-13 6,-10 C14,-7 13,3 6,9 C-1,15 -9,13 -10,4 Z';

/** A single adrenal gland cap. `adrenalReserve` visually shrinks/desaturates the gland as
 * it atrophies under sustained ACTH suppression (steroid-induced atrophy). */
export function AdrenalGland({ x, y, cortisolIntensity, adrenalReserve }: AdrenalGlandProps) {
  const style = {
    '--cortisol-intensity': cortisolIntensity,
    '--adrenal-reserve': adrenalReserve,
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.adrenalShape} d={ADRENAL_PATH} />
      <text className={styles.organLabel} y={30}>
        Adrenal
      </text>
    </g>
  );
}
