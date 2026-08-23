import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { CLINICAL, PUPIL } from '../engine/constants';
import type { VisionDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: VisionDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Acuity"
        value={derived.acuityLabel}
        secondary={derived.acuityDenominator > 12 ? 'resolution lost' : 'foveal cones reading'}
        colorVar="var(--retina)"
      />
      <ReadoutItem
        label="Right pupil"
        value={derived.pupilRightMm.toFixed(1)}
        unit="mm"
        secondary={
          derived.pupilRightMm > PUPIL.DARK_MM - 1 ? 'dilated' : derived.pupilRightMm < PUPIL.CONSTRICTED_MM + 1 ? 'constricted' : 'mid-position'
        }
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Left pupil"
        value={derived.pupilLeftMm.toFixed(1)}
        unit="mm"
        secondary={derived.anisocoriaMm > CLINICAL.ANISOCORIA_SIGNIFICANT_MM ? 'unequal pair' : 'equal pair'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Anisocoria"
        value={derived.anisocoriaMm.toFixed(1)}
        unit="mm"
        secondary={derived.anisocoriaMm > CLINICAL.ANISOCORIA_SIGNIFICANT_MM ? 'efferent side suspect' : 'within normal'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Perceived brightness"
        value={derived.perceivedBrightness.toFixed(0)}
        unit="%"
        secondary={`${derived.regime} scene at ${derived.effectiveLuminanceLogCd >= 0 ? '+' : ''}${derived.effectiveLuminanceLogCd.toFixed(1)} log cd/m²`}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Glutamate release"
        value={(derived.glutamateRelease * 100).toFixed(0)}
        unit="%"
        secondary={derived.glutamateRelease > 0.7 ? 'dark — receptors depolarised' : 'light — receptors hyperpolarised'}
        colorVar="var(--vm)"
      />
      <ReadoutItem
        label="Rod drive"
        value={(derived.rodDrive * 100).toFixed(0)}
        unit="%"
        secondary={derived.rodDrive > 0.5 ? 'rods carrying vision' : 'rods saturated or lost'}
        colorVar="var(--vm)"
      />
      <ReadoutItem
        label="Cone drive"
        value={(derived.coneDrive * 100).toFixed(0)}
        unit="%"
        secondary={derived.coneDrive > 0.5 ? 'cones carrying vision' : 'below cone threshold'}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Swinging torch"
        value={Math.min(derived.directReflexRightScore, derived.directReflexLeftScore).toFixed(0)}
        unit="%"
        secondary={derived.rapdPositive ? 'RAPD — weaker from left eye' : 'direct = consensual'}
        colorVar="var(--danger)"
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
