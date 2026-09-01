import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { hasAirTrapping } from '../engine/engine';
import type { RespMechDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: RespMechDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  const airTrapping = hasAirTrapping(derived.respiratoryRate, derived.timeConstantSeconds);

  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="FEV1/FVC"
        value={derived.fev1RatioPercent.toFixed(0)}
        unit="%"
        secondary={derived.spirometryPattern}
        colorVar="var(--resistance)"
      />
      <ReadoutItem label="FVC" value={(derived.fvcML / 1000).toFixed(2)} unit="L" colorVar="var(--compliance)" />
      <ReadoutItem label="FEV1" value={(derived.fev1ML / 1000).toFixed(2)} unit="L" colorVar="var(--resistance)" />
      <ReadoutItem
        label="Peak flow"
        value={(derived.peakExpiratoryFlowMLPerSec / 1000).toFixed(1)}
        unit="L/s"
        colorVar="var(--resistance)"
      />
      <ReadoutItem label="TLC" value={(derived.totalLungCapacityML / 1000).toFixed(2)} unit="L" colorVar="var(--compliance)" />
      <ReadoutItem label="FRC" value={(derived.functionalResidualCapacityML / 1000).toFixed(2)} unit="L" colorVar="var(--compliance)" />
      <ReadoutItem label="RV" value={(derived.residualVolumeML / 1000).toFixed(2)} unit="L" colorVar="var(--compliance)" />
      <ReadoutItem
        label="Time constant"
        value={derived.timeConstantSeconds.toFixed(2)}
        unit="s"
        secondary={airTrapping ? 'air trapping' : undefined}
        colorVar="var(--resistance)"
      />
      <ReadoutItem label="V/Q unit A" value={derived.vqRatioA.toFixed(2)} colorVar="var(--vq)" />
      <ReadoutItem
        label="V/Q unit B"
        value={derived.vqRatioB >= 10 ? '≫1' : derived.vqRatioB.toFixed(2)}
        secondary={derived.vqRatioB > 2 ? 'dead space' : derived.vqRatioB < 0.6 ? 'shunt' : undefined}
        colorVar="var(--vq)"
      />
      <ReadoutItem
        label="Alveolar ventilation"
        value={(derived.alveolarVentilationMLPerMin / 1000).toFixed(1)}
        unit="L/min"
        colorVar="var(--compliance)"
      />
      <ReadoutItem
        label="Work of breathing"
        value={derived.workOfBreathingJPerMin.toFixed(1)}
        unit=" J/min"
        colorVar="var(--resistance)"
      />
      <ReadoutItem label="HPV diversion" value={(derived.hpvDiversionLevel * 100).toFixed(0)} unit="%" colorVar="var(--vq)" />
    </div>
  );
}
