import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface BoneProps {
  x: number;
  y: number;
  /** Current bone resorption rate — visibly erodes the bone as it rises */
  resorptionRate: number;
}

// A long bone: shaft with flared epiphyses at each end.
const BONE_PATH =
  'M-10,-34 C-18,-40 -30,-36 -30,-26 C-30,-19 -24,-16 -16,-17 L-8,-14 L-8,14 L-16,17 C-24,16 -30,19 -30,26 C-30,36 -18,40 -10,34 C-4,38 8,38 12,32 C20,36 30,32 30,23 C30,16 24,13 16,14 L8,11 L8,-11 L16,-14 C24,-13 30,-16 30,-23 C30,-32 20,-36 12,-32 C8,-38 -4,-38 -10,-34 Z';

export function Bone({ x, y, resorptionRate }: BoneProps) {
  const style = { '--resorption': resorptionRate } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.boneShape} d={BONE_PATH} />
      <text className={styles.organLabel} y={56}>
        Bone
      </text>
    </g>
  );
}
