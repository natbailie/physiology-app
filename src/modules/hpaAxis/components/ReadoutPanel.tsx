import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { HpaDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: HpaDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem label="Cortisol" value={derived.cortisolLevel.toFixed(1)} unit="µg/dL" colorVar="var(--cortisol)" />
      <ReadoutItem label="ACTH" value={`${(derived.acthLevel * 100).toFixed(0)}%`} colorVar="var(--acth)" />
      <ReadoutItem label="CRH drive" value={`${(derived.crhDrive * 100).toFixed(0)}%`} colorVar="var(--co2)" />
      <ReadoutItem label="Adrenal reserve" value={`${(derived.adrenalReserve * 100).toFixed(0)}%`} colorVar="var(--text)" />
    </div>
  );
}
