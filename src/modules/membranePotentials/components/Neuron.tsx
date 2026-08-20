import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface NeuronProps {
  x: number;
  y: number;
  /** 0..1, how depolarized the membrane currently is (rest → peak) */
  depolarization: number;
  /** 0..1, normalized sodium conductance */
  gNaNormalized: number;
  /** 0..1, normalized potassium conductance */
  gKNormalized: number;
  /** 0..1.5, myelination — thins the myelin segments as it falls */
  myelination: number;
  isRefractory: boolean;
}

const MYELIN_SEGMENT_XS = [42, 86, 130, 174];

/** A neuron: soma with dendrites, plus a myelinated axon carrying the depolarization wave.
 * Sodium and potassium channels in the membrane brighten with their conductances, so the
 * m³h-then-n⁴ sequence of the action potential is directly visible. */
export function Neuron({ x, y, depolarization, gNaNormalized, gKNormalized, myelination, isRefractory }: NeuronProps) {
  const style = {
    '--depolarization': depolarization,
    '--gna': gNaNormalized,
    '--gk': gKNormalized,
    '--myelination': Math.min(myelination, 1),
    '--refractory': isRefractory ? 1 : 0,
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.dendrite} d="M-26,-8 L-46,-26 M-26,0 L-50,-2 M-26,8 L-46,22" />
      <circle className={styles.somaShape} cx={0} cy={0} r={24} />

      <path className={styles.axonShaft} d="M24,0 L212,0" />
      {MYELIN_SEGMENT_XS.map((segmentX) => (
        <rect key={segmentX} className={styles.myelinSegment} x={segmentX} y={-9} width={32} height={18} rx={7} />
      ))}

      {/* Voltage-gated channels sitting in the membrane at a node of Ranvier. */}
      <rect className={styles.sodiumChannel} x={70} y={-26} width={13} height={13} rx={3} />
      <rect className={styles.potassiumChannel} x={70} y={14} width={13} height={13} rx={3} />
      <text className={styles.pathLabel} x={90} y={-16}>
        Na+
      </text>
      <text className={styles.pathLabel} x={90} y={25}>
        K+
      </text>

      <text className={styles.organLabel} y={48}>
        Axon
      </text>
      <text className={styles.refractoryBadge} x={0} y={-40}>
        Refractory
      </text>
    </g>
  );
}
