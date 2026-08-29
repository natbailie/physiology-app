import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { RespDerived, RespInputs } from '../engine/types';

interface ReadoutPanelProps {
  derived: RespDerived;
  inputs: RespInputs;
}

export function ReadoutPanel({ derived, inputs }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem label="PaO2" value={derived.paO2.toFixed(0)} unit="mmHg" colorVar="var(--o2)" />
      <ReadoutItem label="PaCO2" value={derived.paCO2.toFixed(0)} unit="mmHg" colorVar="var(--co2)" />
      <ReadoutItem label="pH" value={derived.pH.toFixed(2)} colorVar="var(--ph)" />
      <ReadoutItem label="HCO3-" value={derived.plasmaHCO3.toFixed(0)} unit="mEq/L" colorVar="var(--bicarb)" />
      <ReadoutItem label="SaO2" value={derived.saO2.toFixed(0)} unit="%" colorVar="var(--o2)" />
      {/* The slider sets the ventilation the patient is ordered; chemoreceptor drive then scales
          it, so the achieved value routinely differs from the control. */}
      <ReadoutItem
        label="Minute ventilation"
        value={derived.effectiveMinuteVentilation.toFixed(0)}
        unit="%"
        setPoint={inputs.minuteVentilation}
        colorVar="var(--co2)"
      />
      <ReadoutItem label="A-a gradient" value={derived.aaGradient.toFixed(0)} unit="mmHg" colorVar="var(--text)" />
      <ReadoutItem label="Anion gap" value={derived.anionGapMEqL.toFixed(0)} unit="mEq/L" colorVar="var(--ph)" />
      <ReadoutItem
        label="Interpretation"
        value={derived.interpretation.short}
        secondary={derived.interpretation.detail}
        colorVar={derived.interpretation.isMixed ? 'var(--danger)' : 'var(--bicarb)'}
        wide
      />
    </div>
  );
}
