import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { MECHANISM_LABELS } from '../engine/edemaClassification';
import type { CapillaryDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: CapillaryDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Capillary pressure"
        value={derived.capillaryPressureMmHg.toFixed(1)}
        unit="mmHg"
        secondary={`${derived.arteriolarEndPressure.toFixed(0)} → ${derived.venularEndPressure.toFixed(0)} along it`}
        colorVar="var(--capillary)"
      />
      <ReadoutItem
        label="Interstitial pressure"
        value={derived.interstitialPressureMmHg.toFixed(1)}
        unit="mmHg"
        secondary={derived.interstitialPressureMmHg < 0 ? 'subatmospheric' : 'positive — gel saturated'}
        colorVar="var(--interstitium)"
      />
      <ReadoutItem
        label="Plasma oncotic"
        value={derived.plasmaOncoticMmHg.toFixed(1)}
        unit="mmHg"
        secondary={`sigma ${derived.reflectionCoefficient.toFixed(2)}`}
        colorVar="var(--capillary)"
      />
      <ReadoutItem
        label="Interstitial oncotic"
        value={derived.interstitialOncoticMmHg.toFixed(1)}
        unit="mmHg"
        secondary={`${derived.interstitialProteinGDl.toFixed(1)} g/dL protein`}
        colorVar="var(--interstitium)"
      />
      <ReadoutItem
        label="Net filtration pressure"
        value={`${derived.netFiltrationPressure >= 0 ? '+' : ''}${derived.netFiltrationPressure.toFixed(2)}`}
        unit="mmHg"
        secondary={derived.venularNetPressure < 0 ? 'venular end reabsorbs' : 'filtering along its whole length'}
        colorVar="var(--capillary)"
      />
      <ReadoutItem
        label="Filtration rate"
        value={derived.filtrationRateMlPerMin.toFixed(2)}
        unit="mL/min"
        secondary={`net ${derived.netAccumulationMlPerMin >= 0 ? '+' : ''}${derived.netAccumulationMlPerMin.toFixed(2)} into tissue`}
        colorVar="var(--capillary)"
      />
      <ReadoutItem
        label="Lymph flow"
        value={derived.lymphFlowMlPerMin.toFixed(2)}
        unit="mL/min"
        secondary={`capacity ${derived.lymphaticCapacityMlPerMin.toFixed(1)}`}
        colorVar="var(--lymph)"
      />
      <ReadoutItem
        label="Lymphatic reserve"
        value={(derived.lymphaticReserveFraction * 100).toFixed(0)}
        unit="%"
        secondary={derived.lymphaticReserveFraction <= 0.02 ? 'exhausted — fluid accumulating' : 'still in hand'}
        colorVar={derived.lymphaticReserveFraction <= 0.02 ? 'var(--danger)' : 'var(--lymph)'}
      />
      <ReadoutItem
        label="Interstitial volume"
        value={derived.interstitialVolumeMl.toFixed(0)}
        unit="mL"
        secondary={`${derived.interstitialExcess >= 0 ? '+' : ''}${(derived.interstitialExcess * 100).toFixed(0)}% of normal`}
        colorVar="var(--interstitium)"
      />
      <ReadoutItem
        label="Oedema"
        value={(derived.oedemaSeverity * 100).toFixed(0)}
        unit="%"
        secondary={derived.isPitting ? 'free fluid — pits' : 'bound in gel — no pitting'}
        colorVar={derived.oedemaSeverity > 0.3 ? 'var(--danger)' : 'var(--interstitium)'}
      />
      <ReadoutItem
        label="Safety factor left"
        value={derived.safetyFactorMmHg.toFixed(1)}
        unit="mmHg"
        secondary="before fluid accumulates"
        colorVar="var(--ok)"
      />
      <ReadoutItem
        label="Plasma volume"
        value={derived.plasmaVolumeMl.toFixed(0)}
        unit="mL"
        secondary={MECHANISM_LABELS[derived.dominantMechanism]}
        colorVar="var(--artery)"
      />
    </div>
  );
}
