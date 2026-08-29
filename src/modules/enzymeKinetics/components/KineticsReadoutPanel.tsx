import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { KineticsDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: KineticsDerived;
}

function inhibitionLabel(derived: KineticsDerived): string {
  switch (derived.inhibitorType) {
    case 'competitive':
      return 'Km′ raised — outcompete it';
    case 'noncompetitive':
      return 'Vmax′ cut';
    case 'uncompetitive':
      return 'both cut in proportion';
    default:
      return 'none active';
  }
}

export function KineticsReadoutPanel({ derived }: ReadoutPanelProps) {
  const saturationLabel =
    derived.saturationPct > 90
      ? 'saturated — more substrate barely helps'
      : derived.saturationPct < 15
        ? 'first-order — rate tracks substrate'
        : 'mixed-order region';
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Reaction rate"
        value={derived.reactionRateUmPerMin.toFixed(1)}
        unit="µmol/min"
        secondary={`${derived.residualActivityPct.toFixed(0)}% of uninhibited`}
        colorVar="var(--ecg-trace)"
      />
      <ReadoutItem
        label="Apparent Km′"
        value={derived.apparentKmMm < 0.1 ? derived.apparentKmMm.toFixed(3) : derived.apparentKmMm.toFixed(2)}
        unit="mmol/L"
        secondary={inhibitionLabel(derived)}
        colorVar="var(--conduction-path)"
      />
      <ReadoutItem label="Apparent Vmax′" value={derived.apparentVmaxUmPerMin.toFixed(0)} unit="µmol/min" colorVar="var(--repolarizing)" />
      <ReadoutItem
        label="Site saturation"
        value={derived.saturationPct.toFixed(0)}
        unit="%"
        secondary={saturationLabel}
        colorVar="var(--potassium)"
      />
      <ReadoutItem
        label="Temperature factor"
        value={`×${derived.temperatureFactor.toFixed(2)}`}
        secondary={derived.temperatureFactor > 1.05 ? 'Q10 gain' : derived.temperatureFactor < 0.9 ? 'denaturing' : 'near optimum'}
        colorVar="var(--thermal)"
      />
      <ReadoutItem
        label="pH factor"
        value={`×${derived.phFactor.toFixed(2)}`}
        secondary={derived.phFactor > 0.95 ? 'at the optimum' : 'off-optimum ionisation'}
        colorVar="var(--gastrin)"
      />
    </div>
  );
}
