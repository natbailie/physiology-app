import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { GlucoseDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: GlucoseDerived;
}

function glucoseStatus(mgDl: number): string {
  if (mgDl < 54) return 'severe hypoglycemia';
  if (mgDl < 70) return 'hypoglycemia';
  if (mgDl > 180) return 'marked hyperglycemia';
  if (mgDl > 140) return 'hyperglycemia';
  return 'euglycemic';
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Blood glucose"
        value={derived.bloodGlucoseMgDl.toFixed(0)}
        unit="mg/dL"
        secondary={glucoseStatus(derived.bloodGlucoseMgDl)}
        colorVar="var(--glucose)"
      />
      <ReadoutItem label="Insulin" value={(derived.insulinLevel * 100).toFixed(0)} unit="%" colorVar="var(--insulin)" />
      <ReadoutItem label="Glucagon" value={(derived.glucagonLevel * 100).toFixed(0)} unit="%" colorVar="var(--glucagon)" />
      <ReadoutItem
        label="Counter-regulation"
        value={(derived.counterRegulatoryDrive * 100).toFixed(0)}
        unit="%"
        colorVar="var(--epinephrine)"
      />
      <ReadoutItem
        label="Glycogen reserve"
        value={(derived.hepaticGlycogenReserve * 100).toFixed(0)}
        unit="%"
        colorVar="var(--glucose)"
      />
      <ReadoutItem label="Meal remaining" value={derived.mealBolusRemaining.toFixed(0)} unit="g" colorVar="var(--text)" />
    </div>
  );
}
