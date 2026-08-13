import type { CSSProperties } from 'react';
import styles from './Readouts.module.css';

interface ReadoutItemProps {
  label: string;
  value: string;
  unit?: string;
  secondary?: string;
  colorVar?: string;
}

export function ReadoutItem({ label, value, unit, secondary, colorVar }: ReadoutItemProps) {
  const style = colorVar ? ({ '--tile-color': colorVar } as CSSProperties) : undefined;
  return (
    <div className={styles.tile}>
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
