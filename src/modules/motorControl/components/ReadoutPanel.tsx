import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { MotorDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: MotorDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Initiation latency"
        value={derived.initiationLatencyMs.toFixed(0)}
        unit="ms"
        secondary={derived.initiationLatencyMs > 500 ? 'bradykinesia — dopamine failure' : 'prompt start'}
        colorVar="var(--basal-ganglia)"
      />
      <ReadoutItem
        label="Achieved amplitude"
        value={derived.achievedAmplitudePct.toFixed(0)}
        unit="% of command"
        secondary={
          derived.amplitudeErrorPct > 25
            ? derived.dysmetriaPct > 15
              ? 'dysmetria dominates'
              : 'hypokinesia — micrographia territory'
            : 'on target'
        }
        colorVar="var(--basal-ganglia)"
      />
      <ReadoutItem
        label="Resting tremor"
        value={derived.restingTremorAmp.toFixed(1)}
        secondary={derived.restingTremorAmp > 2 ? '4-6 Hz, quiets on action' : 'silent'}
        colorVar="var(--nociception)"
      />
      <ReadoutItem
        label="Intention tremor"
        value={derived.intentionTremorAmp.toFixed(1)}
        secondary={derived.intentionTremorAmp > 2 ? 'worse near the target' : 'absent'}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Postural tremor"
        value={derived.posturalTremorAmp.toFixed(1)}
        secondary={derived.posturalTremorAmp > 2 ? 'against gravity, suppressant-responsive' : 'absent'}
        colorVar="var(--warn)"
      />
      <ReadoutItem
        label="Involuntary movement"
        value={derived.involuntaryMovementIndex.toFixed(1)}
        secondary={derived.ballismAmp > derived.choreaAmp ? 'ballism (STN release)' : derived.choreaAmp > 1 ? 'chorea (striatal loss)' : 'none'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Rigidity vs spasticity"
        value={`${derived.rigidityScore.toFixed(1)} / ${derived.spasticityScore.toFixed(1)}`}
        secondary={derived.rigidityScore > derived.spasticityScore ? 'velocity-independent, cogwheel' : derived.spasticityScore > 3 ? 'clasp-knife, velocity-dependent' : 'normal tone'}
        colorVar="var(--basal-ganglia)"
      />
      <ReadoutItem
        label="Gait"
        value={derived.gaitClass}
        colorVar="var(--text)"
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
