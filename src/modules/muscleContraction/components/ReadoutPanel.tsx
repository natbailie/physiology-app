import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { MuscleDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: MuscleDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Cytosolic Ca2+"
        value={derived.cytosolicCalciumUM.toFixed(2)}
        unit="uM"
        secondary={`SR store ${(derived.srCalciumLoad * 100).toFixed(0)}%`}
        colorVar="var(--calcium)"
      />
      <ReadoutItem
        label="Troponin occupied"
        value={derived.troponinOccupancy.toFixed(2)}
        secondary="calcium → activation"
        colorVar="var(--calcium)"
      />
      <ReadoutItem
        label="Cross-bridges attached"
        value={derived.activeCrossBridgeFraction.toFixed(2)}
        secondary={derived.isInRigor ? 'rigor — cannot detach' : derived.isLatched ? 'latch bridges holding' : undefined}
        colorVar="var(--sarcomere)"
      />
      <ReadoutItem
        label="Active tension"
        value={derived.activeTension.toFixed(0)}
        unit="%"
        secondary={`max isometric ${derived.maxIsometricTension.toFixed(0)}%`}
        colorVar="var(--sarcomere)"
      />
      <ReadoutItem
        label="Passive tension"
        value={derived.passiveTension.toFixed(0)}
        unit="%"
        secondary="titin & connective tissue"
        colorVar="var(--sarcomere)"
      />
      <ReadoutItem
        label="Sarcomere length"
        value={derived.sarcomereLengthUm.toFixed(2)}
        unit="um"
        secondary={`overlap ${(derived.lengthTensionFactor * 100).toFixed(0)}%`}
        colorVar="var(--sarcomere)"
      />
      <ReadoutItem
        label="Shortening velocity"
        value={derived.shorteningVelocityUmPerS.toFixed(2)}
        unit="um/s"
        secondary={derived.contractionMode}
        colorVar="var(--vm)"
      />
      <ReadoutItem label="Power output" value={(derived.powerOutput / 10).toFixed(1)} secondary="tension x velocity" colorVar="var(--vm)" />
      <ReadoutItem
        label="Stimulus interval"
        value={Number.isFinite(derived.effectiveStimulusIntervalMs) ? derived.effectiveStimulusIntervalMs.toFixed(0) : '--'}
        unit="ms"
        secondary={derived.isFused ? 'fused tetanus' : derived.isTetanic ? 'summating' : 'separate twitches'}
        colorVar="var(--vm)"
      />
      <ReadoutItem
        label="Motor units active"
        value={derived.activeMotorUnits.toFixed(0)}
        secondary="smallest recruited first"
        colorVar="var(--axon)"
      />
      <ReadoutItem
        label="Relaxation time"
        value={derived.relaxationTimeMs.toFixed(0)}
        unit="ms"
        secondary="set by SERCA & ATP"
        colorVar="var(--calcium)"
      />
      <ReadoutItem
        label="Temperature"
        value={derived.temperatureC.toFixed(1)}
        unit="C"
        secondary="heat from ATP turnover"
        colorVar={derived.temperatureC > 39 ? 'var(--danger)' : 'var(--text-dim)'}
      />
    </div>
  );
}
