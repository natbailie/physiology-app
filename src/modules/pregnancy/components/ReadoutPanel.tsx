import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { PregnancyDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: PregnancyDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Haemoglobin"
        value={derived.haemoglobinGPerDl.toFixed(1)}
        unit="g/dL"
        secondary={`dilution: plasma +${derived.plasmaVolIncreasePct.toFixed(0)}% vs red cells +${derived.redCellMassIncreasePct.toFixed(0)}%`}
        colorVar="var(--hemoglobin)"
      />
      <ReadoutItem
        label="Cardiac output"
        value={`+${derived.cardiacOutputIncreasePct.toFixed(0)}`}
        unit="%"
        secondary="peaks by the late second trimester"
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="SVR"
        value={`${derived.svrChangePct >= 0 ? '+' : ''}${derived.svrChangePct.toFixed(0)}`}
        unit="%"
        secondary={derived.svrChangePct > 5 ? 'Gestational vasodilatation reversed' : 'physiological fall'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="MAP"
        value={derived.meanArterialPressureMmHg.toFixed(0)}
        unit="mmHg"
        secondary={derived.meanArterialPressureMmHg > 95 ? 'raised — placental axis failing' : 'mid-trimester dip is normal'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="PaCO2"
        value={derived.paCO2MmHg.toFixed(0)}
        unit="mmHg"
        secondary={`compensated (HCO3 ${derived.bicarbonateMmolL.toFixed(1)}, pH ${derived.phArterial.toFixed(3)})`}
        colorVar="var(--co2)"
      />
      <ReadoutItem
        label="Creatinine"
        value={derived.creatinineMgDl.toFixed(2)}
        unit="mg/dL"
        secondary={`GFR +${derived.gfrIncreasePct.toFixed(0)}% — a non-pregnant value here means injury`}
        colorVar="var(--tubule)"
      />
      <ReadoutItem
        label="Serum sodium"
        value={derived.serumSodiumMmolL.toFixed(1)}
        unit="mmol/L"
        secondary="osmostat reset downward"
        colorVar="var(--sodium)"
      />
      <ReadoutItem
        label="Fetal weight"
        value={derived.fetalWeightG.toFixed(0)}
        unit="g"
        secondary={derived.fetalWeightG < 2200 && derived.pregnancyProgressFraction > 0.75 ? 'small for gestation' : 'along the growth curve'}
        colorVar="var(--placenta)"
      />
      <ReadoutItem
        label="Progesterone"
        value={derived.progesteroneNgMl.toFixed(0)}
        unit="ng/mL"
        secondary={derived.deliveredEffective ? 'withdrawn — lactogenesis unblocked' : 'blocks secretory activation'}
        colorVar="var(--progesterone)"
      />
      <ReadoutItem
        label="Prolactin"
        value={derived.prolactinNgMl.toFixed(0)}
        unit="ng/mL"
        secondary="primed antenatally, sustained by suckling after"
        colorVar="var(--lh)"
      />
      <ReadoutItem
        label="Oxytocin / milk"
        value={`${derived.oxytocinRelative.toFixed(0)} · ${derived.milkSupplyMlPerDay.toFixed(0)}`}
        unit="mL/day"
        secondary="ejects vs produces — different hormones, different speeds"
        colorVar="var(--estrogen)"
      />
      <ReadoutItem
        label="State"
        value={derived.classification}
        secondary={derived.patternSummary}
        colorVar="var(--text)"
        wide
        revealsPattern
      />
    </div>
  );
}
