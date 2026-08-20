import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import { LAB_BASELINE } from '../engine/constants';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { CoagDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: CoagDerived;
}

/** Flags a value as prolonged/low/raised so the PATTERN across the panel is readable at a
 * glance — which is the actual clinical skill this module teaches. */
function flag(value: number, upper: number, lower?: number): string | undefined {
  if (lower !== undefined && value < lower) return 'low';
  if (value > upper) return 'prolonged';
  return 'normal';
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="PT"
        value={derived.ptSeconds.toFixed(1)}
        unit="s"
        secondary={flag(derived.ptSeconds, LAB_BASELINE.PT_SECONDS * 1.2)}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="INR"
        value={derived.inr.toFixed(2)}
        secondary={derived.inr > 1.2 ? 'raised' : 'normal'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="APTT"
        value={derived.apttSeconds.toFixed(1)}
        unit="s"
        secondary={flag(derived.apttSeconds, LAB_BASELINE.APTT_SECONDS * 1.2)}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Bleeding time"
        value={derived.bleedingTimeMinutes.toFixed(1)}
        unit="min"
        secondary={flag(derived.bleedingTimeMinutes, LAB_BASELINE.BLEEDING_TIME_MINUTES * 1.4)}
        colorVar="var(--platelet)"
      />
      <ReadoutItem
        label="Platelets"
        value={derived.plateletCountValue.toFixed(0)}
        unit="×10⁹/L"
        secondary={derived.plateletCountValue < 150 ? 'low' : 'normal'}
        colorVar="var(--platelet)"
      />
      <ReadoutItem
        label="Fibrinogen"
        value={derived.fibrinogenMgDl.toFixed(0)}
        unit="mg/dL"
        secondary={derived.fibrinogenMgDl < 180 ? 'low' : 'normal'}
        colorVar="var(--fibrin)"
      />
      <ReadoutItem
        label="D-dimer"
        value={derived.dDimerNgMl.toFixed(0)}
        unit="ng/mL"
        secondary={derived.dDimerNgMl > 3000 ? 'markedly raised' : derived.dDimerNgMl > 500 ? 'raised' : 'normal'}
        colorVar="var(--plasmin)"
      />
      <ReadoutItem
        label="Thrombin"
        value={(derived.thrombin * 100).toFixed(0)}
        unit="%"
        secondary="peak burst"
        colorVar="var(--thrombin)"
      />
      <ReadoutItem
        label="Clot strength"
        value={(derived.clotStrength * 100).toFixed(0)}
        unit="%"
        secondary={derived.isBleeding ? 'inadequate' : undefined}
        colorVar="var(--fibrin)"
      />
      <ReadoutItem
        label="Time to clot"
        value={derived.timeToClotSeconds > 0 ? derived.timeToClotSeconds.toFixed(0) : '—'}
        unit={derived.timeToClotSeconds > 0 ? 's' : undefined}
        secondary={derived.timeToClotSeconds > 0 ? undefined : 'not sealed'}
        colorVar="var(--ok)"
      />
    </div>
  );
}
