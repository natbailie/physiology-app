import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { AnsDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: AnsDerived;
}

function balanceLabel(balance: number): string {
  if (balance > 0.25) return 'sympathetic dominant';
  if (balance < -0.25) return 'parasympathetic dominant';
  return 'balanced';
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  const balanceColor = derived.autonomicBalance >= 0 ? 'var(--sympathetic)' : 'var(--parasympathetic)';

  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Autonomic balance"
        value={derived.autonomicBalance.toFixed(2)}
        secondary={balanceLabel(derived.autonomicBalance)}
        colorVar={balanceColor}
      />
      <ReadoutItem label="Heart rate" value={derived.heartRateBpm.toFixed(0)} unit="bpm" colorVar="var(--sympathetic)" />
      <ReadoutItem label="Gut motility" value={derived.giMotilityIndex.toFixed(0)} colorVar="var(--parasympathetic)" />
      <ReadoutItem label="Pupil" value={derived.pupilDiameterMm.toFixed(1)} unit="mm" colorVar="var(--sympathetic)" />
      <ReadoutItem
        label="Bronchial calibre"
        value={derived.bronchialDiameterPercent.toFixed(0)}
        unit="%"
        colorVar="var(--parasympathetic)"
      />
      <ReadoutItem label="Secretions" value={derived.secretionIndex.toFixed(0)} colorVar="var(--parasympathetic)" />
      <ReadoutItem label="Alpha-1" value={(derived.alpha1Activation * 100).toFixed(0)} unit="%" colorVar="var(--sympathetic)" />
      <ReadoutItem label="Beta-1" value={(derived.beta1Activation * 100).toFixed(0)} unit="%" colorVar="var(--sympathetic)" />
      <ReadoutItem label="Beta-2" value={(derived.beta2Activation * 100).toFixed(0)} unit="%" colorVar="var(--sympathetic)" />
      <ReadoutItem
        label="Muscarinic"
        value={(derived.muscarinicActivation * 100).toFixed(0)}
        unit="%"
        colorVar="var(--parasympathetic)"
      />
    </div>
  );
}
