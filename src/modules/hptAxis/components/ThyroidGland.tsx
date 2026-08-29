import styles from './Diagram.module.css';

interface ThyroidGlandProps {
  /** Hormone output, 0–1. Brightens the colloid in the follicles. */
  intensity: number;
  /** Glandular function, 0–1. */
  glandFunction: number;
}

/** One lobe, mirrored: the thyroid's butterfly is the most recognisable gland in the body and
 * costs nothing to draw properly. */
const LOBE = 'M -8 -16 C -20 -18, -30 -6, -28 8 C -26 20, -14 24, -8 16 C -3 8, -3 -6, -8 -16 Z';

/**
 * The thyroid, drawn as two lobes and an isthmus, with follicles inside it.
 *
 * The follicles are where the hormone is actually stored — the thyroid is the one endocrine
 * gland that keeps months of its product on the shelf, which is why its diseases come on slowly
 * and why replacement takes weeks to show. A featureless blob says none of that.
 */
export function ThyroidGland({ intensity, glandFunction }: ThyroidGlandProps) {
  const follicles = Math.max(1, Math.round(glandFunction * 4));
  return (
    <g style={{ '--thyroid-intensity': intensity } as React.CSSProperties}>
      <path className={styles.thyroidLobe} d={LOBE} />
      <path className={styles.thyroidLobe} d={LOBE} transform="scale(-1, 1)" />
      <rect className={styles.thyroidIsthmus} x={-8} y={-4} width={16} height={12} rx={3} />
      {[-1, 1].map((side) =>
        Array.from({ length: follicles }, (_, i) => (
          <circle
            key={`${side}-${i}`}
            className={styles.follicle}
            cx={side * (13 + (i % 2) * 7)}
            cy={-8 + Math.floor(i / 2) * 12 + (i % 2) * 6}
            r={3.4}
          />
        )),
      )}
    </g>
  );
}
