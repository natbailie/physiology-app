import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { CLASSIFICATION } from '../engine/constants';
import type { FetalDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: FetalDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  const gap = derived.saturationGradientPercent;
  const ductal = derived.ductalShuntFraction;

  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Pre-ductal SpO₂"
        value={derived.preDuctalSaturationPercent.toFixed(0)}
        unit="%"
        secondary="right arm"
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Post-ductal SpO₂"
        value={derived.postDuctalSaturationPercent.toFixed(0)}
        unit="%"
        secondary={gap > CLASSIFICATION.DIFFERENTIAL_GAP_PERCENT ? `${gap.toFixed(0)}% below the arm` : 'foot'}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Pulmonary resistance"
        value={derived.pulmonaryVascularResistance.toFixed(1)}
        unit="x mature"
        secondary={
          derived.pulmonaryVascularResistance > derived.systemicVascularResistance
            ? 'exceeds systemic'
            : 'below systemic'
        }
        colorVar="var(--venous)"
      />
      <ReadoutItem
        label="Systemic resistance"
        value={derived.systemicVascularResistance.toFixed(2)}
        secondary={derived.placentalCirculation > 0.1 ? 'placenta attached' : 'cord clamped'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Pulmonary flow"
        value={(derived.pulmonaryFlowFraction * 100).toFixed(0)}
        unit="% of output"
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Ductal shunt"
        value={`${Math.abs(ductal * 100).toFixed(0)}%`}
        secondary={
          Math.abs(ductal) < CLASSIFICATION.SIGNIFICANT_SHUNT
            ? 'none'
            : ductal > 0
              ? 'right to left'
              : 'left to right'
        }
        colorVar={ductal > 0 ? 'var(--venous)' : 'var(--artery)'}
      />
      <ReadoutItem
        label="Duct patency"
        value={(derived.ductusArteriosusPatency * 100).toFixed(0)}
        unit="%"
        secondary={derived.prostaglandinLevel > 40 ? 'held open by prostin' : undefined}
        colorVar="var(--venous)"
      />
      <ReadoutItem
        label="Foramen ovale"
        value={(derived.foramenOvalePatency * 100).toFixed(0)}
        unit="%"
        secondary={
          derived.leftAtrialPressureMmHg > derived.rightAtrialPressureMmHg ? 'held shut by LA pressure' : 'shunting'
        }
        colorVar="var(--venous)"
      />
      <ReadoutItem label="Phase" value={derived.phase} secondary={derived.shuntSummary} colorVar="var(--text)" />
    </div>
  );
}
