import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { MedullaDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: MedullaDerived;
}

export function AdrenalMedullaReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="MAP"
        value={derived.mapMmHg.toFixed(0)}
        unit="mmHg"
        secondary={derived.mapMmHg > 150 ? 'catecholamine-driven' : derived.mapMmHg > 110 ? 'sustained rise' : 'controlled'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Heart rate"
        value={derived.heartRateBpm.toFixed(0)}
        unit="bpm"
        secondary={
          derived.heartRateBpm > 95
            ? 'beta-dominated — adrenaline talking'
            : derived.mapMmHg > 125
              ? 'reflex-slowed by pressure'
              : 'ordinary'
        }
        colorVar="var(--epinephrine)"
      />
      <ReadoutItem
        label="Orthostatic drop"
        value={derived.orthostaticDropMmHg.toFixed(0)}
        unit="mmHg"
        secondary={`plasma volume ${derived.bloodVolumePct.toFixed(0)}% — contracted by chronic vasoconstriction`}
        colorVar="var(--venous)"
      />
      <ReadoutItem
        label="Arrhythmia risk"
        value={derived.arrhythmiaRiskPct.toFixed(0)}
        unit="%"
        secondary="beta effects unopposed raise this"
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Classical triad"
        value={`${derived.triadCount}/3`}
        secondary={`${derived.triadHeadache ? 'headache ' : ''}${derived.triadSweating ? 'sweating ' : ''}${derived.triadPalpitations ? 'palpitations' : ''}`.trim() || 'none present'}
        colorVar="var(--warn)"
      />
      <ReadoutItem
        label="Paroxysm"
        value={derived.paroxysmActive ? 'active' : 'quiet'}
        secondary="events, not states — metanephrines integrate them"
        colorVar="var(--nociception)"
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
