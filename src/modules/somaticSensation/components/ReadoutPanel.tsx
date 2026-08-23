import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { SomaticDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: SomaticDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Pain score"
        value={derived.perceivedPainScore.toFixed(1)}
        unit="/10"
        secondary={derived.allodyniaActive ? 'includes pain from touch' : 'transmission-cell output'}
        colorVar="var(--nociception)"
      />
      <ReadoutItem
        label="Gate"
        value={(derived.gateOpenFraction * 100).toFixed(0)}
        unit="% open"
        secondary={derived.gateOpenFraction > 0.5 ? 'nociceptive traffic passing' : 'inhibitory interneurons winning'}
        colorVar="var(--warn)"
      />
      <ReadoutItem
        label="C-fibre traffic"
        value={derived.cFibreTraffic.toFixed(0)}
        secondary={`second pain ${derived.secondPainLatencyMs.toFixed(0)} ms`}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Aβ traffic"
        value={derived.abTraffic.toFixed(0)}
        secondary={`touch ${derived.touchLatencyMs.toFixed(0)} ms — closes the gate`}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Touch below (L/R)"
        value={`${derived.touchLeftPct.toFixed(0)}/${derived.touchRightPct.toFixed(0)}`}
        unit="%"
        secondary="dorsal columns, ipsilateral"
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Pain/temp below (L/R)"
        value={`${derived.painTempLeftPct.toFixed(0)}/${derived.painTempRightPct.toFixed(0)}`}
        unit="%"
        secondary="spinothalamics, already crossed"
        colorVar="var(--nociception)"
      />
      <ReadoutItem
        label="Segmental pain/temp"
        value={derived.segmentalPainTempPct.toFixed(0)}
        unit="%"
        secondary="syrinx level (arms before legs)"
        colorVar="var(--nociception)"
      />
      <ReadoutItem
        label="Proprioception below"
        value={`${Math.min(derived.proprioceptionLeftPct, derived.proprioceptionRightPct).toFixed(0)}%`}
        secondary="travels with touch"
        colorVar="var(--o2)"
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
