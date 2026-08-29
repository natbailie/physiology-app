import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import { RETICULOCYTE } from '../engine/constants';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { ErythroDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: ErythroDerived;
}

function mcvLabel(mcv: number): string {
  if (mcv < 80) return 'microcytic';
  if (mcv > 100) return 'macrocytic';
  return 'normocytic';
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  // "Hypoproliferative" is only a meaningful verdict once the patient is actually anemic — a
  // healthy person sits at an index of about 1 and is responding perfectly appropriately,
  // because nothing is asking them to respond harder.
  const hypoproliferative = derived.isHypoproliferative;
  const reticSecondary = hypoproliferative
    ? 'hypoproliferative'
    : derived.reticulocyteIndex >= RETICULOCYTE.ADEQUATE_RESPONSE_THRESHOLD
      ? 'adequate response'
      : 'normal';

  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Hemoglobin"
        value={derived.hemoglobinGDl.toFixed(1)}
        unit="g/dL"
        secondary={derived.anemiaClassification}
        colorVar="var(--hemoglobin)"
      />
      <ReadoutItem label="Hematocrit" value={derived.hematocritPercent.toFixed(0)} unit="%" colorVar="var(--hemoglobin)" />
      <ReadoutItem label="MCV" value={derived.mcv.toFixed(0)} unit="fL" secondary={mcvLabel(derived.mcv)} colorVar="var(--iron)" />
      <ReadoutItem
        label="Retic index"
        value={derived.reticulocyteIndex.toFixed(2)}
        secondary={reticSecondary}
        colorVar={hypoproliferative ? 'var(--warn)' : 'var(--ok)'}
      />
      <ReadoutItem
        label="EPO"
        value={(derived.epoLevel * 100).toFixed(0)}
        unit="%"
        secondary={derived.epoLevel < 0.25 && derived.hemoglobinGDl < 12 ? 'inappropriately low' : undefined}
        colorVar="var(--epo)"
      />
      <ReadoutItem
        label="Marrow output"
        value={(derived.marrowOutput * 100).toFixed(0)}
        unit="%"
        colorVar="var(--marrow)"
      />
      <ReadoutItem
        label="Ferritin"
        value={derived.ferritinNgMl.toFixed(0)}
        unit="ng/mL"
        secondary={derived.ferritinNgMl < 30 ? 'depleted' : derived.inflammationLevelPct > 20 ? 'acute-phase veil' : undefined}
        colorVar="var(--iron)"
      />
      <ReadoutItem
        label="Hepcidin"
        value={(derived.hepcidinFraction * 100).toFixed(0)}
        unit="%"
        secondary={
          derived.hepcidinFraction > 2.5
            ? 'ferroportin shut — iron locked away'
            : derived.hepcidinFraction < 0.4
              ? 'export door wide open'
              : undefined
        }
        colorVar="var(--liver)"
      />
      <ReadoutItem
        label="Transferrin saturation"
        value={derived.transferrinSaturationPct.toFixed(0)}
        unit="%"
        secondary={
          derived.transferrinSaturationPct < 16
            ? 'deficient range'
            : derived.transferrinSaturationPct > 45
              ? 'overload range'
              : 'normal range'
        }
        colorVar={
          derived.transferrinSaturationPct < 16 || derived.transferrinSaturationPct > 45
            ? 'var(--danger)'
            : 'var(--text)'
        }
      />
      <ReadoutItem
        label="Serum iron / TIBC"
        value={`${derived.serumIronUgDl.toFixed(0)}/${derived.tibcUgDl.toFixed(0)}`}
        unit="µg/dL"
        colorVar="var(--text)"
      />
      <ReadoutItem
        label="O2 delivery"
        value={(derived.oxygenDeliveryMlPerMin / 100).toFixed(1)}
        unit="×100 mL/min"
        colorVar="var(--o2)"
      />
    </div>
  );
}
