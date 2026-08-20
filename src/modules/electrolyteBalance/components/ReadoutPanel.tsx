import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { BASELINE } from '../engine/constants';
import type { ElectrolyteDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: ElectrolyteDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  const totalBodyPotassiumPct = (derived.totalBodyPotassiumMeq / BASELINE.EXCHANGEABLE_POTASSIUM_MEQ) * 100;

  return (
    <div className={styles.grid}>
      {/* Measured — what the laboratory reports. */}
      <ReadoutItem
        label="Serum Na+"
        value={derived.serumSodiumMeqL.toFixed(1)}
        unit="mEq/L"
        secondary={`corrected ${derived.correctedSodiumMeqL.toFixed(1)}`}
        colorVar="var(--sodium)"
      />
      <ReadoutItem
        label="Serum K+"
        value={derived.serumPotassiumMeqL.toFixed(2)}
        unit="mEq/L"
        secondary={derived.ecgRisk}
        colorVar="var(--potassium)"
      />
      <ReadoutItem
        label="Effective osmolality"
        value={derived.effectiveOsmolality.toFixed(0)}
        unit="mOsm"
        secondary={`${derived.tonicity} · measured ${derived.serumOsmolality.toFixed(0)}`}
        colorVar="var(--sodium)"
      />

      {/* Total body — what is actually there. */}
      <ReadoutItem
        label="Total body K+"
        value={totalBodyPotassiumPct.toFixed(0)}
        unit="%"
        secondary={`${derived.totalBodyPotassiumMeq.toFixed(0)} mEq`}
        colorVar="var(--potassium)"
      />
      <ReadoutItem
        label="Transcellular shift"
        value={derived.transcellularShiftMeqPerDay.toFixed(0)}
        unit="mEq/d"
        secondary={derived.transcellularShiftMeqPerDay > 0 ? 'into cells' : 'out of cells'}
        colorVar="var(--potassium)"
      />
      <ReadoutItem
        label="ECF volume"
        value={derived.ecfVolumeL.toFixed(1)}
        unit="L"
        secondary={`${derived.ecfVolumeStatus} · ICF ${derived.icfVolumeL.toFixed(1)} L`}
        colorVar="var(--sodium)"
      />

      {/* Renal handling. */}
      <ReadoutItem
        label="Urine osmolality"
        value={derived.urineOsmolality.toFixed(0)}
        unit="mOsm"
        secondary={`${derived.urineVolumeLPerDay.toFixed(1)} L/day`}
        colorVar="var(--urine)"
      />
      <ReadoutItem
        label="Free water clearance"
        value={derived.freeWaterClearanceLPerDay.toFixed(2)}
        unit="L/d"
        secondary={derived.freeWaterClearanceLPerDay < 0 ? 'retaining free water' : 'excreting free water'}
        colorVar="var(--adh)"
      />
      <ReadoutItem
        label="TTKG"
        value={derived.transtubularKGradient.toFixed(1)}
        secondary="is the kidney the cause?"
        colorVar="var(--tubule)"
      />
      <ReadoutItem
        label="Na+ excretion"
        value={derived.sodiumExcretionMeqPerDay.toFixed(0)}
        unit="mEq/d"
        secondary={`K+ ${derived.potassiumExcretionMeqPerDay.toFixed(0)} mEq/d`}
        colorVar="var(--kidney)"
      />
      <ReadoutItem
        label="Na+ change rate"
        value={`${derived.sodiumChangeRateMeqLPerDay >= 0 ? '+' : ''}${derived.sodiumChangeRateMeqLPerDay.toFixed(1)}`}
        unit="mEq/L/d"
        secondary={derived.demyelinationRisk > 0.1 ? 'demyelination risk' : 'within safe limits'}
        colorVar={derived.demyelinationRisk > 0.1 ? 'var(--danger)' : 'var(--text-dim)'}
      />
      <ReadoutItem
        label="Brain-adapted Na+"
        value={derived.adaptedSodiumMeqL.toFixed(1)}
        unit="mEq/L"
        secondary="what the brain is used to"
        colorVar="var(--memory)"
      />
    </div>
  );
}
