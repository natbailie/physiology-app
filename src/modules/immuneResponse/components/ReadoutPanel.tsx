import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import { CYTOKINES } from '../engine/constants';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { ImmuneDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: ImmuneDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  const febrile = derived.temperatureC > CYTOKINES.NORMAL_TEMPERATURE_C + 0.8;

  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Pathogen load"
        value={(derived.pathogenLoad * 100).toFixed(0)}
        unit="%"
        secondary={derived.pathogenLoad === 0 ? 'cleared' : undefined}
        colorVar="var(--pathogen)"
      />
      <ReadoutItem
        label="Temperature"
        value={derived.temperatureC.toFixed(1)}
        unit="°C"
        secondary={febrile ? 'febrile' : undefined}
        colorVar={febrile ? 'var(--pathogen)' : 'var(--text)'}
      />
      <ReadoutItem label="Phase" value={derived.responsePhase} colorVar="var(--adaptive)" />
      <ReadoutItem
        label="Day"
        value={derived.daysSinceChallenge >= 0 ? derived.daysSinceChallenge.toFixed(1) : '—'}
        secondary={derived.clearanceTimeDays > 0 ? `cleared d${derived.clearanceTimeDays.toFixed(1)}` : undefined}
        colorVar="var(--text)"
      />
      <ReadoutItem label="Innate" value={(derived.innateActivity * 100).toFixed(0)} unit="%" colorVar="var(--innate)" />
      <ReadoutItem
        label="Helper T"
        value={(derived.helperTActivity * 100).toFixed(0)}
        unit="%"
        secondary="licenses both arms"
        colorVar="var(--adaptive)"
      />
      <ReadoutItem label="Cytotoxic T" value={(derived.cytotoxicTActivity * 100).toFixed(0)} unit="%" colorVar="var(--adaptive)" />
      <ReadoutItem label="IgM" value={(derived.igmTitre * 100).toFixed(0)} unit="%" secondary="first" colorVar="var(--antibody)" />
      <ReadoutItem label="IgG" value={(derived.iggTitre * 100).toFixed(0)} unit="%" secondary="class switched" colorVar="var(--antibody)" />
      <ReadoutItem
        label="Memory"
        value={(derived.memoryLevel * 100).toFixed(0)}
        unit="%"
        secondary={derived.memoryLevel > 0.4 ? 'protected' : undefined}
        colorVar="var(--memory)"
      />
    </div>
  );
}
