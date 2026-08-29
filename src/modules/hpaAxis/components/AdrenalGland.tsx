import styles from './Diagram.module.css';

interface AdrenalGlandProps {
  /** Cortisol output, 0–1. Brightens the cortex. */
  intensity: number;
  /** Remaining cortical mass, 0–1. Steroid suppression wastes the cortex specifically. */
  reserve: number;
}

/**
 * The adrenal as a cap on the kidney, with its cortex drawn separately from its medulla.
 *
 * The distinction earns its place here: cortisol comes from the cortex, and it is the cortex
 * that wastes under sustained suppression while the medulla carries on making catecholamines.
 * A single blob that merely shrinks cannot say which half is being lost.
 */
export function AdrenalGland({ intensity, reserve }: AdrenalGlandProps) {
  // Cortical thickness IS the reserve: a suppressed adrenal is a thin rim round a normal medulla.
  const cortexWidth = 5 + reserve * 9;
  return (
    <g style={{ '--cortisol-intensity': intensity, '--adrenal-reserve': reserve } as React.CSSProperties}>
      {/* Kidney beneath, for scale and orientation. */}
      <path className={styles.kidneyShape} d="M -20 6 C -30 6, -34 18, -26 28 C -18 38, 2 40, 12 30 C 22 20, 18 6, 6 4 C -2 3, -12 4, -20 6 Z" />
      {/* Adrenal cap: outer cortex, inner medulla. */}
      <path
        className={styles.adrenalCortex}
        style={{ strokeWidth: cortexWidth }}
        d="M -22 -2 C -20 -22, -4 -32, 8 -26 C 22 -20, 26 -6, 18 0 C 6 6, -12 8, -22 -2 Z"
      />
      <path
        className={styles.adrenalMedulla}
        d="M -12 -4 C -10 -16, -2 -22, 6 -18 C 14 -14, 14 -6, 8 -3 C 1 0, -8 1, -12 -4 Z"
      />
      <text className={styles.glandTick} x={30} y={-14}>
        cortex
      </text>
      <text className={styles.glandTick} x={30} y={-2}>
        medulla
      </text>
    </g>
  );
}
