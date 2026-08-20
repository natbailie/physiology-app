import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { MembraneDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: MembraneDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Membrane potential"
        value={derived.vmMillivolts.toFixed(0)}
        unit="mV"
        secondary={derived.isRefractory ? 'refractory' : undefined}
        colorVar="var(--vm)"
      />
      <ReadoutItem label="Resting potential" value={derived.restingPotentialMv.toFixed(0)} unit="mV" colorVar="var(--k-current)" />
      <ReadoutItem label="E(Na+)" value={derived.eNa.toFixed(0)} unit="mV" colorVar="var(--na-current)" />
      <ReadoutItem label="E(K+)" value={derived.eK.toFixed(0)} unit="mV" colorVar="var(--k-current)" />
      <ReadoutItem label="Na+ activation (m)" value={derived.gNaActivation.toFixed(2)} colorVar="var(--na-current)" />
      <ReadoutItem
        label="Na+ available (h)"
        value={derived.gNaInactivation.toFixed(2)}
        secondary="excitability reserve"
        colorVar="var(--na-current)"
      />
      <ReadoutItem label="K+ activation (n)" value={derived.gKActivation.toFixed(2)} colorVar="var(--k-current)" />
      <ReadoutItem
        label="Conduction velocity"
        value={derived.conductionVelocityMPerS.toFixed(0)}
        unit="m/s"
        colorVar="var(--axon)"
      />
    </div>
  );
}
