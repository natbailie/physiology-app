import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { ISCHAEMIA } from '../engine/constants';
import type { CoronaryDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: CoronaryDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  const reserveVerdict =
    derived.flowReserveRatio < 1
      ? 'exhausted'
      : derived.flowReserveRatio < 2
        ? 'critically low'
        : derived.flowReserveRatio < 3.5
          ? 'reduced'
          : 'healthy';
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Flow reserve"
        value={`×${derived.flowReserveRatio.toFixed(1)}`}
        secondary={reserveVerdict}
        colorVar={derived.flowReserveRatio < 2 ? 'var(--danger)' : 'var(--o2)'}
      />
      <ReadoutItem
        label="Demand"
        value={`×${derived.requiredFlow.toFixed(2)}`}
        unit="rest"
        secondary={`RPP ${(derived.ratePressureProduct / 1000).toFixed(1)}k`}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Maximal supply"
        value={`×${derived.maximalFlowCapacity.toFixed(2)}`}
        unit="rest"
        secondary={`carriage ${(derived.oxygenCarriageRatio * 100).toFixed(0)}%`}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Ischaemia"
        value={`${(derived.ischaemiaLevel * 100).toFixed(0)}%`}
        secondary={
          derived.transmuralInjuryActive
            ? 'transmural'
            : derived.ischaemiaLevel >= ISCHAEMIA.GAP_ONSET
              ? 'subendocardial first'
              : 'none'
        }
        colorVar={derived.anginaActive ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Diastolic window"
        value={`${(derived.diastolicTimeFraction * 100).toFixed(0)}%`}
        secondary={`systole ${derived.systolicDurationSeconds.toFixed(2)} s at ${derived.effectiveHeartRateBpm.toFixed(0)} bpm`}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Driving head"
        value={derived.drivingPressureMmHg.toFixed(0)}
        unit="mmHg"
        secondary={`closing ${derived.closingPressureMmHg.toFixed(0)}`}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Wall stress"
        value={`×${derived.wallStressIndex.toFixed(2)}`}
        secondary={`LVEDP ${derived.leftVentricularEndDiastolicPressureMmHg.toFixed(0)} mmHg`}
        colorVar="var(--text)"
      />
      <ReadoutItem
        label="Lesion"
        value={`${(derived.stenosisEffectiveFraction * 100).toFixed(0)}%`}
        secondary={derived.collateralFraction > 0.08 ? `collaterals ${(derived.collateralFraction * 100).toFixed(0)}%` : 'no collaterals'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Functional contractility"
        value={`×${derived.functionalContractility.toFixed(2)}`}
        secondary={
          derived.functionalContractility < derived.effectiveContractilityFraction * 0.95
            ? 'depressed by ischaemia'
            : undefined
        }
        colorVar="var(--text)"
      />
      <ReadoutItem
        label="Infarcted territory"
        value={`${derived.necrosisLoadPct.toFixed(1)}%`}
        secondary={derived.necrosisLoadPct > 0.5 ? 'does not grow back' : undefined}
        colorVar={derived.necrosisLoadPct > 0 ? 'var(--danger)' : 'var(--text)'}
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
