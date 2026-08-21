import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { CLASSIFICATION } from '../engine/constants';
import type { NmjDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: NmjDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Safety factor"
        value={derived.safetyFactor.toFixed(2)}
        secondary={derived.safetyFactor < CLASSIFICATION.LOW_SAFETY_FACTOR ? 'reserve spent' : 'reserve intact'}
        colorVar="var(--vm)"
      />
      <ReadoutItem
        label="Muscle force"
        value={derived.muscleForcePercent.toFixed(0)}
        unit="%"
        secondary={derived.muscleForcePercent < CLASSIFICATION.WEAK_FORCE_PERCENT ? 'weak' : 'full'}
        colorVar="var(--sarcomere)"
      />
      <ReadoutItem
        label="End-plate potential"
        value={derived.endPlatePotentialMv.toFixed(1)}
        unit="mV"
        colorVar="var(--o2)"
      />
      <ReadoutItem label="Quanta released" value={derived.quantalContent.toFixed(0)} colorVar="var(--vm)" />
      <ReadoutItem
        label="Train-of-four ratio"
        value={derived.trainOfFourRatio.toFixed(2)}
        secondary={derived.trainOfFourRatio < CLASSIFICATION.FADE_RATIO ? 'fade' : 'no fade'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="High-rate response"
        value={`${derived.postTetanicRatio.toFixed(2)}x`}
        secondary={
          derived.postTetanicRatio >= CLASSIFICATION.INCREMENT_RATIO ? 'increment — presynaptic' : 'no increment'
        }
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Vesicle pool"
        value={(derived.vesiclePool * 100).toFixed(0)}
        unit="%"
        colorVar="var(--vm)"
      />
      <ReadoutItem
        label="Desensitisation"
        value={(derived.desensitisation * 100).toFixed(0)}
        unit="%"
        secondary={derived.desensitisation > 0.4 ? 'end plate held depolarised' : undefined}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Lesion"
        value={derived.classification}
        secondary={derived.patternSummary}
        colorVar="var(--text)"
      />
    </div>
  );
}
