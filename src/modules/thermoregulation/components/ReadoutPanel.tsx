import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { ThermoDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: ThermoDerived;
}

export function ThermoReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Core temp"
        value={derived.coreTempC.toFixed(2)}
        unit="°C"
        secondary={derived.coreTempC >= 39.4 ? 'dangerously high' : derived.coreTempC <= 35 ? 'hypothermic' : 'viable range'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Set point"
        value={derived.setPointC.toFixed(1)}
        unit="°C"
        secondary={derived.setPointC >= 37.8 ? 'Raised — fever is defended' : 'normal defence target'}
        colorVar="var(--warn)"
      />
      <ReadoutItem
        label="Shivering"
        value={derived.shiveringW.toFixed(0)}
        unit="W"
        secondary={derived.shiveringW > 50 ? 'producing extra heat' : 'quiet'}
        colorVar="var(--sympathetic)"
      />
      <ReadoutItem
        label="Sweating"
        value={derived.sweatW.toFixed(0)}
        unit="W"
        secondary={derived.sweatW > 100 ? 'evaporative cooling engaged' : derived.sweatW < 5 ? 'idle' : 'mild'}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Skin flow"
        value={(derived.skinFlowFactor * 100).toFixed(0)}
        unit="%"
        secondary={derived.skinFlowFactor > 1.2 ? 'dilated — dumping heat' : derived.skinFlowFactor < 0.7 ? 'constricted — conserving heat' : 'baseline'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Net storage"
        value={`${derived.netStorageW >= 0 ? '+' : ''}${derived.netStorageW.toFixed(0)}`}
        unit="W"
        secondary={Math.abs(derived.netStorageW) < 10 ? 'in balance' : derived.netStorageW > 0 ? 'Core is rising' : 'core is falling'}
        colorVar="var(--co2)"
      />
      <ReadoutItem
        label="State"
        value={derived.classification}
        secondary={derived.patternSummary}
        colorVar="var(--text)"
        wide
        revealsPattern
      />
    </div>
  );
}
