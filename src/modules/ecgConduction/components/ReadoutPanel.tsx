import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { EcgDerived, EcgInputs } from '../engine/types';

interface ReadoutPanelProps {
  derived: EcgDerived;
  inputs: EcgInputs;
}

function prStatus(prMs: number, dissociated: boolean): string | undefined {
  if (dissociated) return 'dissociated';
  if (prMs > 200) return 'first-degree block';
  return undefined;
}

function qrsStatus(qrsMs: number): string | undefined {
  return qrsMs > 120 ? 'wide' : undefined;
}

function qtcStatus(qtcMs: number): string | undefined {
  if (qtcMs > 460) return 'prolonged';
  if (qtcMs < 350) return 'short';
  return undefined;
}

/** One line on what is driving the rhythm — the fact each preset exists to teach. */
const RHYTHM_NOTES: Record<EcgDerived['rhythm'], string> = {
  sinus: 'sinus',
  atrialFibrillation: 'atrial fibrillation',
  atrialFlutter: 'flutter circuit, 2:1 conduction',
  wpw: 'accessory pathway pre-excitation',
  sickSinus: 'SA pauses, junctional escape',
  ventricularTachycardia: 'ventricular focus, AV dissociation',
  torsades: 'polymorphic VT, axis twisting',
  ventricularFibrillation: 'no organised activity — arrest rhythm',
};

export function ReadoutPanel({ derived, inputs }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Segment"
        value={derived.currentSegment}
        secondary="being written now"
        colorVar="var(--ecg-trace)"
      />
      <ReadoutItem
        label="Voltage"
        value={`${derived.ecgVoltageMv >= 0 ? '+' : ''}${derived.ecgVoltageMv.toFixed(2)}`}
        unit="mV"
        secondary={`lead ${derived.lead}`}
        colorVar="var(--ecg-trace)"
      />
      <ReadoutItem
        label="PR interval"
        value={derived.isDissociated ? '—' : derived.prIntervalMs.toFixed(0)}
        unit={derived.isDissociated ? undefined : 'ms'}
        // Measured PR is the AV delay the slider sets PLUS the QRS onset, so it always reads longer.
        setPoint={derived.isDissociated ? undefined : inputs.avDelayMs}
        secondary={prStatus(derived.prIntervalMs, derived.isDissociated)}
        colorVar="var(--conduction-path)"
      />
      <ReadoutItem
        label="QRS duration"
        value={derived.qrsDurationMs.toFixed(0)}
        unit="ms"
        secondary={qrsStatus(derived.qrsDurationMs)}
        colorVar="var(--depolarized)"
      />
      <ReadoutItem label="QT" value={derived.qtIntervalMs.toFixed(0)} unit="ms" colorVar="var(--repolarizing)" />
      <ReadoutItem
        label="QTc (Bazett)"
        value={derived.qtcMs.toFixed(0)}
        unit="ms"
        secondary={qtcStatus(derived.qtcMs)}
        colorVar="var(--repolarizing)"
      />
      <ReadoutItem
        label="Atrial rate"
        value={derived.heartRateBpm.toFixed(0)}
        unit="bpm"
        secondary={
          derived.rhythm === 'atrialFibrillation' || derived.rhythm === 'ventricularFibrillation'
            ? 'no organised P waves'
            : derived.isDissociated && derived.rhythm !== 'sinus'
              ? 'marching independently'
              : undefined
        }
        colorVar="var(--conduction-path)"
      />
      <ReadoutItem
        label="Ventricular rate"
        value={derived.ventricularRateBpm.toFixed(0)}
        unit="bpm"
        secondary={`mean ${derived.meanVentricularRateBpm.toFixed(0)}${derived.isDissociated ? ' · independent' : ''}`}
        colorVar="var(--depolarized)"
      />
      <ReadoutItem
        label="Mean QRS axis"
        value={`${derived.meanQrsAxisDegrees.toFixed(0)}°`}
        secondary={derived.axisClassification}
        colorVar="var(--ecg-trace)"
      />
      <ReadoutItem
        label="Rhythm"
        value={derived.rhythmRegular ? 'Regular' : 'Irregular'}
        secondary={RHYTHM_NOTES[derived.rhythm]}
        colorVar="var(--conduction-path)"
      />
    </div>
  );
}
