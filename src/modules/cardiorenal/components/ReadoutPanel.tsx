import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { DerivedValues, SimInputs, SimState } from '../engine/types';

interface ReadoutPanelProps {
  state: SimState;
  derived: DerivedValues;
  inputs: SimInputs;
}

export function ReadoutPanel({ state, derived, inputs }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="MAP"
        value={derived.meanArterialPressure.toFixed(0)}
        unit="mmHg"
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Cardiac output"
        value={(derived.cardiacOutput / 1000).toFixed(1)}
        unit="L/min"
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Heart rate"
        value={derived.effectiveHeartRate.toFixed(0)}
        unit="bpm"
        secondary={inputs.heartRate !== Math.round(derived.effectiveHeartRate) ? `slider: ${inputs.heartRate}` : undefined}
        colorVar="var(--artery)"
      />
      <ReadoutItem label="Blood volume" value={state.bloodVolume.toFixed(0)} unit="%" colorVar="var(--text)" />
      <ReadoutItem label="GFR" value={derived.gfr.toFixed(0)} unit="mL/min*" colorVar="var(--kidney)" />
      <ReadoutItem label="Urine output" value={derived.urineOutput.toFixed(0)} unit="mL/min*" colorVar="var(--urine)" />
      <ReadoutItem
        label="RAAS activity"
        value={`${(derived.raasActivation * 100).toFixed(0)}%`}
        colorVar="var(--raas)"
      />
      <ReadoutItem label="ANP activity" value={`${(derived.anpLevel * 100).toFixed(0)}%`} colorVar="var(--anp)" />
    </div>
  );
}
