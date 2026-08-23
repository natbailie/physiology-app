import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { HypersensitivityDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: HypersensitivityDerived;
}

const MECHANISM_LABEL: Record<string, string> = {
  I: 'Type I',
  II: 'Type II',
  III: 'Type III',
  IV: 'Type IV',
  none: 'No reaction',
};

/** Recognising that a reaction is NOT one of the four types is a diagnosis in its own right. */
const NON_IMMUNE_LABEL: Record<string, string> = {
  'volume overload': 'Not immune — overload',
  'capillary leak': 'Not immune — leaky lung',
  'stored cytokines': 'Not immune — cytokines',
};

const MECHANISM_COLOUR: Record<string, string> = {
  I: 'var(--ige)',
  II: 'var(--cytotoxic-ab)',
  III: 'var(--immune-complex)',
  IV: 'var(--delayed-type)',
  none: 'var(--ok)',
};

function onsetLabel(onsetHours: number): string {
  if (onsetHours < 0) return '—';
  if (onsetHours < 1) return `${Math.round(onsetHours * 60)} min`;
  if (onsetHours < 48) return `${onsetHours.toFixed(1)} h`;
  return `${(onsetHours / 24).toFixed(1)} d`;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  const mechanism = derived.dominantMechanism;
  return (
    <div className={styles.grid}>
      <ReadoutItem label="Onset" value={onsetLabel(derived.onsetHours)} colorVar="var(--text)" />
      <ReadoutItem
        label="Tissue injury"
        value={(derived.tissueInjury * 100).toFixed(0)}
        unit="%"
        colorVar="var(--danger)"
      />
      <ReadoutItem label="Tryptase" value={derived.tryptaseNgMl.toFixed(0)} unit="ng/mL" colorVar="var(--ige)" />
      <ReadoutItem
        label="C3 / C4"
        value={`${derived.c3MgDl.toFixed(0)} / ${derived.c4MgDl.toFixed(0)}`}
        unit="mg/dL"
        colorVar="var(--complement)"
      />
      <ReadoutItem
        label="Direct Coombs"
        value={derived.directCoombs > 0.25 ? 'Positive' : 'Negative'}
        colorVar="var(--cytotoxic-ab)"
      />
      <ReadoutItem
        label="Haptoglobin"
        value={derived.haptoglobinMgDl.toFixed(0)}
        unit="mg/dL"
        colorVar="var(--cytotoxic-ab)"
      />
      <ReadoutItem label="Temperature" value={derived.temperatureC.toFixed(1)} unit="&deg;C" colorVar="var(--warn)" />
      <ReadoutItem
        label="Haemoglobin"
        value={derived.haemoglobinGDl.toFixed(1)}
        unit="g/dL"
        colorVar="var(--hemoglobin)"
      />
      <ReadoutItem label="SaO2" value={derived.saO2Percent.toFixed(0)} unit="%" colorVar="var(--o2)" />
      <ReadoutItem
        label="BNP"
        value={derived.bnpPgMl.toFixed(0)}
        unit="pg/mL"
        secondary={derived.bnpPgMl > 150 ? 'stretched ventricle — volume' : 'ventricle not loaded'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Mean arterial pressure"
        value={derived.meanArterialPressureMmHg.toFixed(0)}
        unit="mmHg"
        colorVar="var(--artery)"
      />
      {/* Paired deliberately: a weal is leaked plasma and an induration is a cellular
          infiltrate, so which of the two a patient has IS the mechanism, felt with a finger. */}
      <ReadoutItem
        label="Wheal / induration"
        value={`${derived.whealMm.toFixed(0)} / ${derived.indurationMm.toFixed(0)}`}
        unit="mm"
        secondary="soft & immediate vs firm & delayed"
        colorVar="var(--ige)"
      />
      <ReadoutItem
        label="Mechanism"
        value={
          mechanism === 'none' && derived.nonImmuneCause
            ? (NON_IMMUNE_LABEL[derived.nonImmuneCause] ?? 'No reaction')
            : (MECHANISM_LABEL[mechanism] ?? 'No reaction')
        }
        secondary={derived.mechanismSummary}
        colorVar={
          mechanism === 'none' && derived.nonImmuneCause
            ? 'var(--warn)'
            : (MECHANISM_COLOUR[mechanism] ?? 'var(--ok)')
        }
        wide
      />
    </div>
  );
}
