import type { CSSProperties } from 'react';
import styles from './ReadoutItem.module.css';

interface ReadoutItemProps {
  label: string;
  value: string;
  unit?: string;
  secondary?: string;
  colorVar?: string;
  /** Span the full width of the readout grid. For a value that is a verdict rather than a
   * number — it needs the room, and an odd tile count otherwise leaves an empty cell. */
  wide?: boolean;
}

export function ReadoutItem({ label, value, unit, secondary, colorVar, wide }: ReadoutItemProps) {
  const style = colorVar ? ({ '--tile-color': colorVar } as CSSProperties) : undefined;
  return (
    <div className={wide ? `${styles.tile} ${styles.wide}` : styles.tile}>
      <span className={`label ${styles.label}`} style={style}>
        {label}
      </span>
      <div className={styles.valueRow}>
        <span className={`numeral ${styles.value}`}>{value}</span>
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {secondary && <span className={`numeral ${styles.secondary}`}>{secondary}</span>}
    </div>
  );
}
