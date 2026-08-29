import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { CLINICAL } from '../engine/constants';
import type { HearingDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: HearingDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="PTA"
        value={derived.ptaDb.toFixed(0)}
        unit="dB HL"
        secondary={derived.ptaDb < 16 ? 'normal' : derived.ptaDb < 41 ? 'mild' : derived.ptaDb < 71 ? 'moderate' : 'severe'}
        colorVar="var(--cochlea)"
      />
      <ReadoutItem
        label="Air-bone gap"
        value={derived.airBoneGapDb.toFixed(0)}
        unit="dB"
        secondary={derived.airBoneGapDb >= CLINICAL.SIGNIFICANT_GAP_DB ? 'middle ear blocking' : 'no gap'}
        colorVar="var(--cochlea)"
      />
      <ReadoutItem
        label="Speech discrimination"
        value={derived.speechDiscriminationPct.toFixed(0)}
        unit="%"
        secondary={
          derived.speechDiscriminationPct >= CLINICAL.NORMAL_DISCRIMINATION_PCT
            ? 'words clear if audible'
            : 'distortion — transducer failing'
        }
        colorVar="var(--ok)"
      />
      <ReadoutItem
        label="Recruitment"
        value={`×${derived.recruitmentIndex.toFixed(2)}`}
        secondary={derived.recruitmentIndex > 1.3 ? 'loudness grows abnormally fast' : 'normal compression'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Loudness"
        value={derived.loudnessPct.toFixed(0)}
        unit="%"
        secondary={`${derived.sensationLevelDb.toFixed(0)} dB above threshold`}
        colorVar="var(--warn)"
      />
      <ReadoutItem
        label="Rinne"
        value={derived.rinneResult.startsWith('negative') ? 'negative' : 'positive'}
        secondary={derived.rinneResult}
        colorVar="var(--text)"
      />
      <ReadoutItem
        label="Weber"
        value={derived.weberResult}
        secondary={derived.weberCode === 1 ? 'toward = conductive' : derived.weberCode === -1 ? 'away = sensorineural' : 'central'}
        colorVar="var(--text)"
      />
      <ReadoutItem
        label="Stapedius reflex"
        value={derived.stapediusActive ? 'contracted' : 'relaxed'}
        secondary="engages above ~85 dB HL"
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="State"
        value={derived.classification}
        secondary={derived.patternSummary}
        colorVar="var(--text)"
        wide
        revealsPattern
      />
    </div>
  );
}
