import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { MvDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: MvDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem label="PaO2" value={derived.paO2.toFixed(0)} unit=" mmHg" colorVar="var(--o2)" />
      <ReadoutItem label="PaCO2" value={derived.paCO2.toFixed(0)} unit=" mmHg" colorVar="var(--co2)" />
      <ReadoutItem label="SaO2" value={derived.saO2.toFixed(0)} unit="%" colorVar="var(--o2)" />
      <ReadoutItem
        label="pH"
        value={derived.pH.toFixed(2)}
        secondary={derived.respiratoryAcidosis ? 'acidosis' : derived.pH > 7.45 ? 'alkalosis' : undefined}
        colorVar="var(--ph)"
      />
      <ReadoutItem label="Tidal volume" value={derived.tidalVolumeML.toFixed(0)} unit=" mL" colorVar="var(--compliance)" />
      <ReadoutItem
        label="Alveolar vent."
        value={(derived.alveolarVentilationMLPerMin / 1000).toFixed(1)}
        unit=" L/min"
        colorVar="var(--compliance)"
      />
      <ReadoutItem
        label="Peak pressure"
        value={derived.peakPressureCmH2O.toFixed(1)}
        unit=" cmH2O"
        colorVar="var(--resistance)"
      />
      <ReadoutItem
        label="Driving pressure"
        value={derived.drivingPressureCmH2O.toFixed(1)}
        unit=" cmH2O"
        colorVar="var(--resistance)"
      />
      <ReadoutItem
        label="Total PEEP"
        value={derived.totalPeepCmH2O.toFixed(1)}
        unit=" cmH2O"
        secondary={derived.intrinsicPeepCmH2O > 0.5 ? `auto ${derived.intrinsicPeepCmH2O.toFixed(1)}` : undefined}
        colorVar="var(--resistance)"
      />
      <ReadoutItem label="Recruitment" value={(derived.recruitmentLevel * 100).toFixed(0)} unit="%" colorVar="var(--vq)" />
      <ReadoutItem
        label="Eff. shunt"
        value={(derived.effectiveShuntFraction * 100).toFixed(0)}
        unit="%"
        colorVar="var(--vq)"
      />
      <ReadoutItem
        label="Eff. dead space"
        value={(derived.effectiveDeadSpaceFraction * 100).toFixed(0)}
        unit="%"
        colorVar="var(--vq)"
      />
    </div>
  );
}