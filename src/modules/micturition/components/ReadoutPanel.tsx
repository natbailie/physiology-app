import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { BLADDER } from '../engine/constants';
import type { MicturitionDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: MicturitionDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  const volumePct = (derived.bladderVolumeML / BLADDER.MAX_CAPACITY_ML) * 100;

  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Volume"
        value={`${derived.bladderVolumeML.toFixed(0)}`}
        unit="mL"
        secondary={`${volumePct.toFixed(0)}% capacity`}
        colorVar={
          derived.bladderVolumeML >= BLADDER.MAX_CAPACITY_ML - 10
            ? 'var(--danger)'
            : derived.bladderVolumeML >= BLADDER.STRONG_DESIRE_ML
              ? 'var(--artery)'
              : 'var(--text)'
        }
      />
      <ReadoutItem
        label="Pressure"
        value={`${derived.intravesicalPressureCmH2O.toFixed(1)}`}
        unit="cmH₂O"
        secondary={
          derived.intravesicalPressureCmH2O > 50
            ? 'high — approaching sphincter threshold'
            : derived.intravesicalPressureCmH2O > 20
              ? 'moderate'
              : 'low'
        }
        colorVar={derived.intravesicalPressureCmH2O > 50 ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Detrusor"
        value={`${(derived.detrusorTone * 100).toFixed(0)}%`}
        secondary={
          derived.detrusorTone > 0.6
            ? 'contracting'
            : derived.detrusorTone > 0.2
              ? 'moderate tone'
              : 'relaxed'
        }
        colorVar={derived.detrusorTone > 0.6 ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Sphincter"
        value={`${(derived.externalSphincterTone * 100).toFixed(0)}%`}
        secondary={
          derived.externalSphincterTone > 0.7
            ? 'tight closure'
            : derived.externalSphincterTone > 0.3
              ? 'partial closure'
              : 'relaxed / voiding'
        }
        colorVar={
          derived.externalSphincterTone < 0.3 && derived.detrusorTone > 0.3
            ? 'var(--danger)'
            : 'var(--text)'
        }
      />
      <ReadoutItem
        label="Afferent"
        value={`${(derived.afferentFiringRate * 100).toFixed(0)}%`}
        secondary={
          derived.afferentFiringRate > 0.7
            ? 'maximal — urgent'
            : derived.afferentFiringRate > 0.3
              ? 'moderate — aware'
              : 'quiet'
        }
        colorVar={derived.afferentFiringRate > 0.7 ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Flow"
        value={`${derived.netFlowRateMLperMin.toFixed(1)}`}
        unit="mL/min"
        secondary={
          derived.netFlowRateMLperMin < -10
            ? 'voiding'
            : derived.netFlowRateMLperMin > 0
              ? 'filling'
              : 'equilibrium'
        }
        colorVar={derived.netFlowRateMLperMin < -10 ? 'var(--o2)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Phase"
        value={derived.phase}
        secondary={derived.sensation}
        colorVar="var(--text)"
      />
    </div>
  );
}
