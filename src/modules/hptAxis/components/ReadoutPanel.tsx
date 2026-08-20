import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { HptDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: HptDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem label="TSH" value={`${(derived.tshLevel * 100).toFixed(0)}%`} colorVar="var(--tsh)" />
      <ReadoutItem label="T4" value={derived.t4Level.toFixed(1)} unit="µg/dL" colorVar="var(--thyroid)" />
      <ReadoutItem label="T3" value={derived.t3Level.toFixed(0)} unit="ng/dL*" colorVar="var(--thyroid)" />
      <ReadoutItem
        label="Conversion efficiency"
        value={`${(derived.conversionEfficiency * 100).toFixed(0)}%`}
        colorVar="var(--o2)"
      />
    </div>
  );
}
