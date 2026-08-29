import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { CLASSIFICATION } from '../engine/constants';
import type { ShockDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: ShockDerived;
}

function band(value: number, low: number, high: number): string {
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'normal';
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="MAP"
        value={derived.meanArterialPressureMmHg.toFixed(0)}
        unit="mmHg"
        secondary={derived.meanArterialPressureMmHg < CLASSIFICATION.SHOCK_MAP_MMHG ? 'hypotensive' : 'not hypotensive'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Cardiac index"
        value={derived.cardiacIndex.toFixed(1)}
        unit="L/min/m²"
        secondary={band(derived.cardiacIndex, CLASSIFICATION.LOW_CARDIAC_INDEX, CLASSIFICATION.HIGH_CARDIAC_INDEX)}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="CVP"
        value={derived.centralVenousPressureMmHg.toFixed(0)}
        unit="mmHg"
        secondary={
          derived.pericardialPressureMmHg > 1
            ? `transmural only ${derived.transmuralRapMmHg.toFixed(0)}`
            : band(derived.centralVenousPressureMmHg, CLASSIFICATION.LOW_CVP_MMHG, CLASSIFICATION.HIGH_CVP_MMHG)
        }
        colorVar="var(--venous)"
      />
      <ReadoutItem
        label="Wedge pressure"
        value={derived.wedgePressureMmHg.toFixed(0)}
        unit="mmHg"
        secondary={band(derived.wedgePressureMmHg, CLASSIFICATION.LOW_WEDGE_MMHG, CLASSIFICATION.HIGH_WEDGE_MMHG)}
        colorVar="var(--venous)"
      />
      <ReadoutItem
        label="SVR"
        value={`${(derived.effectiveSvr * 100).toFixed(0)}%`}
        secondary={band(derived.effectiveSvr, CLASSIFICATION.LOW_SVR, CLASSIFICATION.HIGH_SVR)}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Heart rate"
        value={derived.heartRateBpm.toFixed(0)}
        unit="bpm"
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Oxygen delivery"
        value={derived.oxygenDeliveryMlPerMin.toFixed(0)}
        unit="mL/min"
        secondary={derived.isOxygenDebt ? 'demand not met' : 'demand met'}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="SvO₂"
        value={derived.mixedVenousSaturationPercent.toFixed(0)}
        unit="%"
        secondary={
          derived.mixedVenousSaturationPercent > 75 && derived.lactateMmolL >= CLASSIFICATION.RAISED_LACTATE_MMOL_L
            ? 'high, but lactate is up'
            : band(derived.mixedVenousSaturationPercent, 60, 75)
        }
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Lactate"
        value={derived.lactateMmolL.toFixed(1)}
        unit="mmol/L"
        secondary={derived.lactateMmolL >= CLASSIFICATION.RAISED_LACTATE_MMOL_L ? 'oxygen debt' : 'normal'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Pattern"
        value={derived.classification}
        secondary={derived.patternSummary}
        colorVar="var(--text)"
        revealsPattern
      />
    </div>
  );
}
