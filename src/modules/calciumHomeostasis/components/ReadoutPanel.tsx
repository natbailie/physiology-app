import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { PRECIPITATION } from '../engine/constants';
import type { CalciumDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: CalciumDerived;
}

function calciumStatus(mgDl: number): string {
  if (mgDl < 8.5) return 'hypocalcemia';
  if (mgDl > 10.5) return 'hypercalcemia';
  return 'normal';
}

function phosphateStatus(mgDl: number): string {
  if (mgDl < 2.5) return 'hypophosphatemia';
  if (mgDl > 4.5) return 'hyperphosphatemia';
  return 'normal';
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Serum calcium"
        value={derived.serumCalciumMgDl.toFixed(1)}
        unit="mg/dL"
        secondary={calciumStatus(derived.serumCalciumMgDl)}
        colorVar="var(--calcium)"
      />
      <ReadoutItem
        label="Serum phosphate"
        value={derived.serumPhosphateMgDl.toFixed(1)}
        unit="mg/dL"
        secondary={phosphateStatus(derived.serumPhosphateMgDl)}
        colorVar="var(--phosphate)"
      />
      <ReadoutItem label="PTH" value={derived.pthPgPerML.toFixed(0)} unit=" pg/mL" colorVar="var(--pth)" />
      <ReadoutItem label="Calcitriol" value={(derived.calcitriolLevel * 100).toFixed(0)} unit="%" colorVar="var(--calcitriol)" />
      <ReadoutItem label="Calcitonin" value={(derived.calcitoninLevel * 100).toFixed(0)} unit="%" colorVar="var(--calcitonin)" />
      <ReadoutItem
        label="Bone resorption"
        value={(derived.boneResorptionRate * 100).toFixed(0)}
        unit="%"
        colorVar="var(--calcium)"
      />
      <ReadoutItem
        label="Gut Ca absorption"
        value={(derived.gutCaAbsorptionFraction * 100).toFixed(0)}
        unit="%"
        colorVar="var(--calcitriol)"
      />
      <ReadoutItem
        label="Ca × PO4 product"
        value={derived.calciumPhosphateProduct.toFixed(0)}
        secondary={derived.calciumPhosphateProduct > PRECIPITATION.CA_P_PRODUCT_THRESHOLD ? 'calcification risk' : undefined}
        colorVar="var(--phosphate)"
      />
    </div>
  );
}
