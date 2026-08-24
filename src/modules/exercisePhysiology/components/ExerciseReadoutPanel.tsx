import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { ExerciseDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: ExerciseDerived;
}

export function ExerciseReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="VO2"
        value={(derived.vo2MlMin / 1000).toFixed(2)}
        unit="L/min"
        secondary={`demand ${derived.vo2DemandMlMin.toFixed(0)} · max ${derived.vo2MaxMlMin.toFixed(0)}`}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Heart rate"
        value={derived.heartRateBpm.toFixed(0)}
        unit="bpm"
        secondary={`max for age ${derived.maxHeartRateBpm.toFixed(0)}`}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Stroke volume"
        value={derived.strokeVolumeMl.toFixed(0)}
        unit="mL"
        secondary="plateaus by half of maximal work"
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Cardiac output"
        value={derived.cardiacOutputLMin.toFixed(1)}
        unit="L/min"
        secondary="rate × stroke volume"
        colorVar="var(--basal-ganglia)"
      />
      <ReadoutItem
        label="a-v O2 difference"
        value={derived.arteriovenousDiffMlDl.toFixed(1)}
        unit="mL/dL"
        secondary="extraction does what flow cannot"
        colorVar="var(--hemoglobin)"
      />
      <ReadoutItem
        label="Lactate"
        value={derived.lactateMmolL.toFixed(1)}
        unit="mmol/L"
        secondary={
          derived.aboveThreshold
            ? `above threshold (${(derived.lactateThresholdFraction * 100).toFixed(0)}%)`
            : `threshold at ${(derived.lactateThresholdFraction * 100).toFixed(0)}% — not yet`
        }
        colorVar="var(--nociception)"
      />
      <ReadoutItem
        label="Ventilation"
        value={derived.ventilationLMin.toFixed(0)}
        unit="L/min"
        secondary="tracks CO2, hyperventilates with acidosis"
        colorVar="var(--co2)"
      />
      <ReadoutItem
        label="Muscle blood flow"
        value={derived.muscleFlowSharePct.toFixed(0)}
        unit="% of CO"
        secondary="gut and kidney donate their share"
        colorVar="var(--sarcomere)"
      />
      <ReadoutItem
        label="Core temp / fatigue"
        value={`${derived.coreTempC.toFixed(1)}°C · ${derived.fatiguePct.toFixed(0)}%`}
        secondary={derived.fatiguePct > 30 ? 'exhaustion approaching' : 'sustaining'}
        colorVar="var(--thermal)"
      />
      <ReadoutItem
        label="State"
        value={derived.classification}
        secondary={derived.patternSummary}
        colorVar="var(--text)"
        wide
      />
    </div>
  );
}
