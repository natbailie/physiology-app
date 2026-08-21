import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { CLASSIFICATION, FLOW } from '../engine/constants';
import type { CerebralDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: CerebralDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="ICP"
        value={derived.intracranialPressureMmHg.toFixed(0)}
        unit="mmHg"
        secondary={derived.intracranialPressureMmHg >= CLASSIFICATION.RAISED_ICP_MMHG ? 'raised' : 'normal'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="CPP"
        value={derived.cerebralPerfusionPressureMmHg.toFixed(0)}
        unit="mmHg"
        secondary={derived.cerebralPerfusionPressureMmHg < CLASSIFICATION.LOW_CPP_MMHG ? 'inadequate' : 'MAP − ICP'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Cerebral blood flow"
        value={derived.cerebralBloodFlow.toFixed(0)}
        unit="mL/100g/min"
        secondary={
          derived.cerebralBloodFlow < FLOW.ISCHAEMIC_THRESHOLD
            ? 'ischaemic'
            : derived.cerebralBloodFlow > FLOW.HYPERAEMIC_THRESHOLD
              ? 'hyperaemic'
              : 'adequate'
        }
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Reserve remaining"
        value={derived.compensatoryReserveMl.toFixed(0)}
        unit="mL"
        secondary={derived.compensatoryReserveMl < CLASSIFICATION.LOW_RESERVE_ML ? 'at the knee' : 'compensating'}
        colorVar="var(--text)"
      />
      <ReadoutItem
        label="Elastance"
        value={derived.elastanceMmHgPerMl.toFixed(2)}
        unit="mmHg/mL"
        secondary="cost of one more mL"
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Cerebral blood volume"
        value={derived.cerebralBloodVolumeMl.toFixed(0)}
        unit="mL"
        secondary={derived.vesselCalibre > 1.1 ? 'vasodilated' : derived.vesselCalibre < 0.9 ? 'vasoconstricted' : undefined}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="CSF excess"
        value={derived.csfExcessMl.toFixed(0)}
        unit="mL"
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Autoregulation"
        value={derived.autoregulating ? 'intact' : 'lost'}
        secondary={derived.autoregulating ? 'flow defended' : 'flow follows pressure'}
        colorVar="var(--text)"
      />
      <ReadoutItem
        label="Heart rate"
        value={derived.reflexHeartRateBpm.toFixed(0)}
        unit="bpm"
        secondary={derived.cushingResponseActive ? 'Cushing bradycardia' : undefined}
        colorVar={derived.cushingResponseActive ? 'var(--danger)' : 'var(--artery)'}
      />
      <ReadoutItem
        label="State"
        value={derived.classification}
        secondary={derived.patternSummary}
        colorVar="var(--text)"
      />
    </div>
  );
}
