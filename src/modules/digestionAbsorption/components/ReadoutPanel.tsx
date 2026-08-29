import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { MICRONUTRIENT, WATER } from '../engine/constants';
import type { DigestionDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: DigestionDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Fat uptake"
        value={derived.currentMealFatAbsorptionPct.toFixed(0)}
        unit="%"
        secondary={`faecal fat ${derived.faecalFatGPerDay.toFixed(1)} g/day`}
        colorVar={derived.faecalFatGPerDay >= 14 ? 'var(--danger)' : 'var(--o2)'}
      />
      <ReadoutItem
        label="Bile salt pool"
        value={derived.bileSaltPoolG.toFixed(1)}
        unit="g"
        secondary={`liver makes ${derived.hepaticSynthesisGPerDay.toFixed(1)} · spills ${derived.spiltBileSaltsGPerDay.toFixed(1)}`}
        colorVar="var(--liver)"
      />
      <ReadoutItem
        label="Emulsification"
        value={(derived.bileEmulsificationFactor * 100).toFixed(0)}
        unit="%"
        secondary="detergent for the fat"
        colorVar="var(--liver)"
      />
      <ReadoutItem
        label="Lactose uptake"
        value={derived.lactoseAbsorbedPct.toFixed(0)}
        unit="%"
        secondary={
          derived.unabsorbedLactoseGPerDay > 1
            ? `${derived.unabsorbedLactoseGPerDay.toFixed(0)} g heading for the colon`
            : 'brush border coping'
        }
        colorVar="var(--gastrin)"
      />
      <ReadoutItem
        label="Stool water"
        value={derived.stoolWaterMlPerDay.toFixed(0)}
        unit="ml/day"
        secondary={derived.stoolClassification}
        colorVar={derived.stoolWaterMlPerDay >= WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Osmotic gap"
        value={derived.stoolOsmoticGapHigh ? 'HIGH' : 'low'}
        secondary={derived.stoolOsmoticGapHigh ? 'unabsorbed solute — stop the food' : 'electrolyte-driven or quiet'}
        colorVar="var(--text)"
      />
      <ReadoutItem
        label="B12 store"
        value={(derived.b12StoreFraction * 100).toFixed(0)}
        unit="%"
        secondary={derived.b12Deficient ? 'deficient — ileal site lost' : 'replete'}
        colorVar={derived.b12Deficient ? 'var(--danger)' : 'var(--marrow)'}
      />
      <ReadoutItem
        label="Iron store"
        value={(derived.ironStoreFraction * 100).toFixed(0)}
        unit="%"
        secondary={derived.ironDeficient ? `deficient — <${MICRONUTRIENT.DEFICIENT_FRACTION * 100}%` : 'replete'}
        colorVar={derived.ironDeficient ? 'var(--danger)' : 'var(--iron)'}
      />
      <ReadoutItem
        label="Nutrition"
        value={(derived.nutritionIndex * 100).toFixed(0)}
        unit="%"
        secondary="drifting toward what absorption delivers"
        colorVar={derived.nutritionIndex < 0.8 ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="State"
        value={derived.classification}
        secondary={derived.patternSummary}
        colorVar="var(--text)"
        revealsPattern
      />
    </div>
  );
}
