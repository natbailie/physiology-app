import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { RespDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: RespDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem label="PaO2" value={derived.paO2.toFixed(0)} unit="mmHg" colorVar="var(--o2)" />
      <ReadoutItem label="PaCO2" value={derived.paCO2.toFixed(0)} unit="mmHg" colorVar="var(--co2)" />
      <ReadoutItem label="pH" value={derived.pH.toFixed(2)} colorVar="var(--ph)" />
      <ReadoutItem label="HCO3-" value={derived.plasmaHCO3.toFixed(0)} unit="mEq/L" colorVar="var(--bicarb)" />
      <ReadoutItem label="SaO2" value={derived.saO2.toFixed(0)} unit="%" colorVar="var(--o2)" />
      <ReadoutItem
        label="Minute ventilation"
        value={derived.effectiveMinuteVentilation.toFixed(0)}
        unit="%"
        colorVar="var(--co2)"
      />
      <ReadoutItem label="A-a gradient" value={derived.aaGradient.toFixed(0)} unit="mmHg" colorVar="var(--text)" />
    </div>
  );
}
