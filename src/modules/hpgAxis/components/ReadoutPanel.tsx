import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { HpgDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: HpgDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  const isFemale = derived.sex === 'female';
  const inPositiveFeedback = derived.feedbackMode === 'positive';

  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Feedback mode"
        value={inPositiveFeedback ? 'POSITIVE' : 'negative'}
        secondary={inPositiveFeedback ? 'LH surge — ovulation' : undefined}
        colorVar={inPositiveFeedback ? 'var(--lh)' : 'var(--text-dim)'}
      />
      <ReadoutItem label="GnRH drive" value={(derived.gnrhDrive * 100).toFixed(0)} unit="%" colorVar="var(--gnrh)" />
      <ReadoutItem label="LH" value={(derived.lhLevel * 100).toFixed(0)} unit="%" colorVar="var(--lh)" />
      <ReadoutItem label="FSH" value={(derived.fshLevel * 100).toFixed(0)} unit="%" colorVar="var(--fsh)" />
      {isFemale ? (
        <>
          <ReadoutItem label="Estrogen" value={(derived.estrogenLevel * 100).toFixed(0)} unit="%" colorVar="var(--estrogen)" />
          <ReadoutItem
            label="Progesterone"
            value={(derived.progesteroneLevel * 100).toFixed(0)}
            unit="%"
            colorVar="var(--progesterone)"
          />
          <ReadoutItem label="Follicle" value={(derived.follicleSize * 100).toFixed(0)} unit="%" colorVar="var(--estrogen)" />
          <ReadoutItem
            label="Cycle day"
            value={derived.cycleDay.toFixed(0)}
            secondary={derived.cyclePhase}
            colorVar="var(--text)"
          />
        </>
      ) : (
        <>
          <ReadoutItem
            label="Testosterone"
            value={(derived.testosteroneLevel * 100).toFixed(0)}
            unit="%"
            colorVar="var(--testosterone)"
          />
          <ReadoutItem
            label="Inhibin"
            value={(derived.inhibinLevel * 100).toFixed(0)}
            unit="%"
            secondary="FSH-selective brake"
            colorVar="var(--fsh)"
          />
        </>
      )}
      <ReadoutItem
        label="Pituitary responsiveness"
        value={(derived.pituitaryResponsiveness * 100).toFixed(0)}
        unit="%"
        secondary={derived.pituitaryResponsiveness < 0.3 ? 'pulsatility lost' : undefined}
        colorVar="var(--gnrh)"
      />
    </div>
  );
}
