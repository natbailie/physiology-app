import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { ACUTE } from '../engine/constants';
import type { InflammationDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: InflammationDerived;
}

const feverVerdict = (temp: number) =>
  temp >= 39 ? 'pyrexia' : temp >= 37.8 ? 'low-grade' : 'afebrile';

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Cardinal signs"
        value={`${(derived.vasodilationIndex * 100).toFixed(0)}%`}
        secondary={`rubor · calor · tumor · dolor`}
        colorVar={derived.vasodilationIndex > 0.5 ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Neutrophils"
        value={`${derived.neutrophilCount10e9PerL.toFixed(1)}`}
        unit="×10⁹/L"
        secondary={
          derived.neutrophilCount10e9PerL > ACUTE.NEUTROPHILIA_THRESHOLD_10E9
            ? 'neutrophilia'
            : derived.neutrophilCount10e9PerL < 4
              ? 'neutropenia'
              : 'normal range'
        }
        colorVar={
          derived.neutrophilCount10e9PerL > ACUTE.NEUTROPHILIA_THRESHOLD_10E9
            ? 'var(--danger)'
            : 'var(--text)'
        }
      />
      <ReadoutItem
        label="CRP"
        value={`${derived.crpMgL.toFixed(0)}`}
        unit="mg/L"
        secondary={derived.crpMgL > 100 ? 'markedly raised' : derived.crpMgL > 20 ? 'raised' : 'normal'}
        colorVar={derived.crpMgL > 100 ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Temperature"
        value={`${derived.coreTemperatureC.toFixed(1)}`}
        unit="°C"
        secondary={feverVerdict(derived.coreTemperatureC)}
        colorVar={derived.coreTemperatureC >= 38 ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Pus"
        value={`${derived.pusBurden.toFixed(2)}`}
        secondary={derived.pusBurden > ACUTE.ABSCESS_PUS_THRESHOLD ? 'abscess forming' : 'draining'}
        colorVar={derived.pusBurden > ACUTE.ABSCESS_PUS_THRESHOLD ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Load"
        value={`${derived.insultLoad.toFixed(2)}`}
        secondary={
          derived.insultLoad > 0.8
            ? 'heavy burden'
            : derived.insultLoad > 0.3
              ? 'moderate'
              : derived.insultLoad > 0.05
                ? 'resolving'
                : 'cleared'
        }
        colorVar={derived.insultLoad > 0.8 ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Chronic"
        value={`${(derived.chronicInflammationIndex * 100).toFixed(0)}%`}
        secondary={derived.chronicInflammationIndex > 0.4 ? 'organised' : 'acute phase'}
        colorVar={derived.chronicInflammationIndex > 0.4 ? 'var(--artery)' : 'var(--text)'}
      />
      <ReadoutItem
        label="State"
        value={derived.classification}
        secondary={derived.patternSummary}
        colorVar="var(--text)"
        revealsPattern
      />
    </div>
  );
}
