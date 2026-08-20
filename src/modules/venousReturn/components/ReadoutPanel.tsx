import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { VenousReturnDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: VenousReturnDerived;
}

const LIMIT_EXPLANATION: Record<VenousReturnDerived['limitingFactor'], string> = {
  preload: 'the veins are setting the output',
  pump: 'the heart is at its ceiling',
  afterload: 'the ceiling is pulled down by afterload',
};

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  const equilibrated = Math.abs(derived.venousReturnLPerMin - derived.cardiacOutputLPerMin) < 0.05;

  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Cardiac output"
        value={derived.cardiacOutputLPerMin.toFixed(2)}
        unit="L/min"
        secondary={equilibrated ? 'at the crossing point' : 'still moving toward it'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Venous return"
        value={derived.venousReturnLPerMin.toFixed(2)}
        unit="L/min"
        secondary={equilibrated ? 'equals output' : `${(derived.venousReturnLPerMin - derived.cardiacOutputLPerMin).toFixed(2)} mismatch`}
        colorVar="var(--venous)"
      />
      <ReadoutItem
        label="Right atrial pressure"
        value={derived.rightAtrialPressureMmHg.toFixed(2)}
        unit="mmHg"
        secondary={`crossing at ${derived.operatingPointPra.toFixed(2)}`}
        colorVar="var(--pv-loop)"
      />
      <ReadoutItem
        label="Mean systemic filling"
        value={derived.meanSystemicFillingPressureMmHg.toFixed(2)}
        unit="mmHg"
        secondary="set by the vessels, not the heart"
        colorVar="var(--venous)"
      />
      <ReadoutItem
        label="Stressed volume"
        value={derived.stressedVolumeMl.toFixed(0)}
        unit="mL"
        secondary="the only part generating pressure"
        colorVar="var(--venous)"
      />
      <ReadoutItem
        label="Unstressed volume"
        value={derived.unstressedVolumeMl.toFixed(0)}
        unit="mL"
        secondary="recruitable by venoconstriction"
        colorVar="var(--venous)"
      />
      <ReadoutItem
        label="Blood volume"
        value={derived.totalBloodVolumeMl.toFixed(0)}
        unit="mL"
        secondary={`compliance ${derived.totalComplianceMlPerMmHg.toFixed(0)} mL/mmHg`}
        colorVar="var(--hemoglobin)"
      />
      <ReadoutItem
        label="Resistance to VR"
        value={derived.resistanceToVenousReturn.toFixed(2)}
        secondary="mostly venous, barely arterial"
        colorVar="var(--resistance)"
      />
      <ReadoutItem
        label="Cardiac curve plateau"
        value={derived.cardiacCurvePlateau.toFixed(1)}
        unit="L/min"
        secondary={`${((derived.cardiacOutputLPerMin / Math.max(derived.cardiacCurvePlateau, 0.01)) * 100).toFixed(0)}% of it used`}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Limiting factor"
        value={derived.limitingFactor}
        secondary={LIMIT_EXPLANATION[derived.limitingFactor]}
        colorVar="var(--pv-loop)"
      />
      <ReadoutItem
        label="Intrathoracic pressure"
        value={derived.effectiveIntrathoracicPressure.toFixed(1)}
        unit="mmHg"
        secondary="what the heart is squeezed by"
        colorVar="var(--compliance)"
      />
      <ReadoutItem
        label="Mean arterial pressure"
        value={derived.meanArterialPressureMmHg.toFixed(0)}
        unit="mmHg"
        secondary="output x resistance"
        colorVar="var(--artery)"
      />
    </div>
  );
}
