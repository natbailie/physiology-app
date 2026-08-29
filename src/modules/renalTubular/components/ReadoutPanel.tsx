import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { RenalTubularDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: RenalTubularDerived;
}

function urineConcentrationLabel(urineOsm: number, plasmaOsm: number): string {
  if (urineOsm > plasmaOsm * 1.15) return 'concentrated';
  if (urineOsm < plasmaOsm * 0.85) return 'dilute';
  return 'iso-osmotic';
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Plasma osmolality"
        value={derived.plasmaOsmolality.toFixed(0)}
        unit="mOsm/kg"
        colorVar="var(--tubule)"
      />
      <ReadoutItem
        label="Urine osmolality"
        value={derived.finalUrineOsmolality.toFixed(0)}
        unit="mOsm/kg"
        secondary={urineConcentrationLabel(derived.finalUrineOsmolality, derived.plasmaOsmolality)}
        colorVar="var(--urine)"
      />
      <ReadoutItem label="ADH" value={(derived.adhLevel * 100).toFixed(0)} unit="%" colorVar="var(--adh)" />
      <ReadoutItem
        label="ADH action at duct"
        value={(derived.effectiveADHAction * 100).toFixed(0)}
        unit="%"
        colorVar="var(--adh)"
      />
      <ReadoutItem
        label="Medullary gradient"
        value={(derived.medullaryGradientStrength * 100).toFixed(0)}
        unit="%"
        colorVar="var(--medulla)"
      />
      <ReadoutItem label="Urine flow" value={derived.urineFlowRateMLPerMin.toFixed(1)} unit="mL/min" colorVar="var(--urine)" />
      <ReadoutItem
        label="Free water clearance"
        value={derived.freeWaterClearance.toFixed(1)}
        unit="mL/min"
        secondary={derived.freeWaterClearance >= 0 ? 'excreting water' : 'retaining water'}
        colorVar="var(--tubule)"
      />
      <ReadoutItem label="GFR (after TGF)" value={derived.gfrAfterTGF.toFixed(0)} unit="mL/min" colorVar="var(--kidney)" />
      <ReadoutItem
        label="Serum bicarbonate"
        value={derived.serumBicarbonateMeqL.toFixed(1)}
        unit="mEq/L"
        secondary={`heading to ${derived.hco3SteadyStateMeqL.toFixed(0)}`}
        colorVar="var(--tubule)"
      />
      <ReadoutItem
        label="Urine pH"
        value={derived.urinePH.toFixed(2)}
        secondary={derived.urinePH > 5.5 ? 'cannot acidify' : 'acidified'}
        colorVar="var(--urine)"
      />
      <ReadoutItem
        label="Urine anion gap"
        value={derived.urineAnionGapMeqL.toFixed(0)}
        unit="mEq/L"
        secondary={derived.urineAnionGapMeqL > 0 ? 'NH4 excretion failing' : 'NH4 excretion intact'}
        colorVar="var(--urine)"
      />
      <ReadoutItem label="Serum potassium" value={derived.serumPotassiumEstimateMeqL.toFixed(2)} unit="mEq/L" colorVar="var(--potassium)" />
      <ReadoutItem
        label="Serum creatinine"
        value={derived.serumCreatinineMgDl.toFixed(2)}
        unit="mg/dL"
        secondary={`heading to ${derived.creatinineEquilibriumMgDl.toFixed(1)}`}
        colorVar="var(--kidney)"
      />
      <ReadoutItem
        label="Creatinine clearance"
        value={derived.creatinineClearanceMLMin.toFixed(0)}
        unit="mL/min"
        secondary={`RPF ${derived.renalPlasmaFlowMLMin.toFixed(0)} · FF ${derived.filtrationFractionPct.toFixed(0)}%`}
        colorVar="var(--kidney)"
      />
      <ReadoutItem
        label="FENa"
        value={derived.fractionalExcretionNaPct.toFixed(2)}
        unit="%"
        secondary={`urine Na ${derived.urineSodiumMeqL.toFixed(0)} mEq/L`}
        colorVar="var(--potassium)"
      />
    </div>
  );
}
