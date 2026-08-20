import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface ThyroidGlandProps {
  x: number;
  y: number;
  thyroidIntensity: number;
  conversionEfficiency: number;
}

const LOBE_PATH = 'M0,-14 C8,-16 14,-8 13,2 C12,11 6,16 0,15 C-2,15 -3,15 -4,14 C-9,10 -12,2 -11,-6 C-10,-13 -6,-16 0,-14 Z';

/** Butterfly-shaped thyroid gland: two lobes plus a thin isthmus, matching the paired-organ
 * mirroring pattern used elsewhere (e.g. Kidneys/Lungs). `conversionEfficiency` drives a faint
 * ring showing where peripheral T4->T3 conversion happens — separate from the gland itself,
 * to visually locate the sick-euthyroid mechanism outside the thyroid. */
export function ThyroidGland({ x, y, thyroidIntensity, conversionEfficiency }: ThyroidGlandProps) {
  const style = {
    '--thyroid-intensity': thyroidIntensity,
    '--conversion-efficiency': conversionEfficiency,
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.thyroidShape} d={LOBE_PATH} transform="translate(-9, 0)" />
      <path className={styles.thyroidShape} d={LOBE_PATH} transform="translate(9, 0) scale(-1, 1)" />
      <path className={styles.thyroidShape} d="M-9,-2 L9,-2 L9,4 L-9,4 Z" />
      <circle className={styles.conversionRing} cx={0} cy={0} r={26} />
      <text className={styles.organLabel} y={38}>
        Thyroid
      </text>
    </g>
  );
}
