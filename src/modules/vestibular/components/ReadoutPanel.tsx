import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { VestibularDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: VestibularDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Spontaneous nystagmus"
        value={derived.slowPhaseVelocityDegPerSec.toFixed(1)}
        unit="°/s"
        secondary={
          Math.abs(derived.slowPhaseVelocityDegPerSec) < 2
            ? 'none'
            : `fast phases ${derived.slowPhaseVelocityDegPerSec > 0 ? 'rightward' : 'leftward'}`
        }
        colorVar="var(--vestibular)"
      />
      <ReadoutItem
        label="Vertigo"
        value={derived.vertigoIntensityPct.toFixed(0)}
        unit="%"
        secondary={derived.vertigoIntensityPct > 40 ? 'severe — uncompensated' : derived.vertigoIntensityPct > 10 ? 'present' : 'quiet'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="VOR gain"
        value={derived.vorGain.toFixed(2)}
        unit="×"
        secondary={derived.vorGain < 0.6 ? 'mechanically deficient' : 'gaze stabilised'}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Head impulse"
        value={derived.headImpulsePositive ? 'positive' : 'negative'}
        secondary={derived.headImpulsePositive ? 'corrective saccade visible' : 'no corrective saccade'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Positional nystagmus"
        value={derived.positionalNystagmusPct.toFixed(0)}
        unit="%"
        secondary={derived.positionalNystagmusPct > 5 ? 'latency + fatigability = BPPV' : 'not provoked'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Cupula deflection"
        value={(derived.cupulaDeflection * 100).toFixed(0)}
        unit="%"
        secondary="signals acceleration, not velocity"
        colorVar="var(--vestibular)"
      />
      <ReadoutItem
        label="Oscillopsia"
        value={derived.oscillopsiaPct.toFixed(0)}
        unit="%"
        secondary="with head motion"
        colorVar="var(--warn)"
      />
      <ReadoutItem
        label="Romberg unsteadiness"
        value={derived.rombergUnsteadinessPct.toFixed(0)}
        unit="%"
        secondary="worse in the dark when high"
        colorVar="var(--warn)"
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
