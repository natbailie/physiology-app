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
        secondary={derived.ferritinNgMl < 30 ? 'depleted' : undefined}
        colorVar="var(--iron)"
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
