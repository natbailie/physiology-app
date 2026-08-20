import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { EcgDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: EcgDerived;
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

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
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
        secondary={derived.rhythmRegular ? undefined : 'no organised P waves'}
        colorVar="var(--conduction-path)"
      />
      <ReadoutItem
        label="Ventricular rate"
        value={derived.ventricularRateBpm.toFixed(0)}
        unit="bpm"
        secondary={derived.isDissociated ? 'independent' : undefined}
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
        secondary={derived.rhythm === 'atrialFibrillation' ? 'atrial fibrillation' : 'sinus'}
        colorVar="var(--conduction-path)"
      />
    </div>
  );
}
