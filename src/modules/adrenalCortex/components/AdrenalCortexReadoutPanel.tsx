import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { AdrenalCortexDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: AdrenalCortexDerived;
}

export function AdrenalCortexReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Cortisol"
        value={derived.effectiveCortisol.toFixed(0)}
        unit="% of normal"
        secondary={`endogenous ${derived.endogenousCortisol.toFixed(0)}${derived.effectiveCortisol > derived.endogenousCortisol + 5 ? ' (+replacement)' : ''}`}
        colorVar="var(--cortisol)"
      />
      <ReadoutItem
        label="Mineralocorticoid"
        value={derived.mineralocorticoidActivity.toFixed(0)}
        unit="% of normal"
        secondary={
          derived.saltWasting
            ? 'SALT-WASTING'
            : derived.hypertensionFromDoc
              ? 'DOC-driven hypertension'
              : 'aldosterone carrying the zone'
        }
        colorVar="var(--raas)"
      />
      <ReadoutItem
        label="Androgens"
        value={derived.androgens.toFixed(0)}
        unit="% of normal"
        secondary={
          derived.androgens > 150 ? 'diverted excess — virilisation' : derived.androgens < 40 ? 'absent — undervirilisation' : 'normal flux'
        }
        colorVar="var(--lh)"
      />
      <ReadoutItem
        label="17-OHP marker"
        value={derived.marker17ohp.toFixed(0)}
        secondary={derived.marker17ohp > 100 ? 'piled up before 21-OH block' : 'not accumulating'}
        colorVar="var(--pth)"
      />
      <ReadoutItem
        label="DOC excess"
        value={derived.docExcess.toFixed(0)}
        secondary={derived.hypertensionFromDoc ? 'weak MC, strong pressure' : 'clearing normally'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="ACTH drive"
        value={derived.acthEffectivePct.toFixed(0)}
        unit="%"
        secondary={derived.acthEffectivePct > 140 ? 'flogging a blocked gland' : 'feedback intact'}
        colorVar="var(--acth)"
      />
      <ReadoutItem
        label="Crisis risk"
        value={derived.addisonianCrisisRiskPct.toFixed(0)}
        unit="%"
        secondary={derived.addisonianCrisisRiskPct > 50 ? 'steroid cover inadequate' : 'covered'}
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
