import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { BloodDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: BloodDerived;
}

export function BloodGroupsReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Crossmatch"
        value={derived.crossmatchVerdict.startsWith('Major') ? 'Major mismatch' : derived.crossmatchVerdict.startsWith('Rh') ? 'Rh mismatch' : 'compatible'}
        secondary={`${derived.donorType} unit into ${derived.recipientType} recipient`}
        colorVar={derived.crossmatchVerdict.startsWith('Major') ? 'var(--danger)' : 'var(--ok)'}
      />
      <ReadoutItem
        label="Reaction arm"
        value={
          derived.reactionArm === 'none'
            ? 'none'
            : derived.reactionArm.startsWith('immediate')
              ? 'intravascular IgM'
              : derived.reactionArm.startsWith('delayed')
                ? 'extravascular IgG'
                : 'placental IgG'
        }
        secondary={
          derived.hdnScenario > 0.5
            ? derived.reactionArm.startsWith('fetal')
              ? 'maternal IgG crossing the placenta'
              : 'fetus not exposed to anti-D'
            : derived.aboIncompatible
              ? 'preformed antibodies — minutes'
              : derived.rhIncompatible
                ? 'acquired antibodies — days'
                : 'no antigen meeting'
        }
        colorVar="var(--transfusion)"
      />
      <ReadoutItem
        label="Haemolysis"
        value={derived.haemolyticSeverity.toFixed(0)}
        unit="% severity"
        secondary={derived.haemolyticSeverity > 5 ? 'cells being destroyed' : 'cells surviving'}
        colorVar="var(--hemoglobin)"
      />
      <ReadoutItem
        label="Free haemoglobin"
        value={derived.plasmaFreeHaemoglobin.toFixed(0)}
        secondary={derived.plasmaFreeHaemoglobin > 20 ? 'intravascular — the ABO signature' : 'plasma clear (extravascular or none)'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Complement consumed"
        value={derived.complementConsumedPct.toFixed(0)}
        unit="%"
        secondary="IgM fixes it; IgG barely does"
        colorVar="var(--complement)"
      />
      <ReadoutItem
        label="DIC risk"
        value={derived.dicRiskPct.toFixed(0)}
        unit="%"
        secondary="thrombin generation from massive haemolysis"
        colorVar="var(--fibrin)"
      />
      <ReadoutItem
        label="Renal injury"
        value={derived.renalInjuryRiskPct.toFixed(0)}
        unit="%"
        secondary="free Hb + shock = tubular damage"
        colorVar="var(--kidney)"
      />
      <ReadoutItem
        label="Haemoglobinuria"
        value={derived.haemoglobinuriaPct.toFixed(0)}
        unit="%"
        secondary="dark urine once free Hb spills over"
        colorVar="var(--urine)"
      />
      {derived.hdnScenario > 0.5 && (
        <>
          <ReadoutItem
            label="Fetal haemoglobin"
            value={derived.fetalHaemoglobinGDl.toFixed(1)}
            unit="g/dL"
            secondary={derived.fetalHaemoglobinGDl < 10 ? 'anaemic — consider transfusion' : 'healthy range'}
            colorVar="var(--hemoglobin)"
          />
          <ReadoutItem
            label="Cord bilirubin"
            value={derived.cordBilirubinUmolL.toFixed(0)}
            unit="µmol/L"
            secondary="the kernicterus number"
            colorVar="var(--liver)"
          />
          <ReadoutItem
            label="Hydrops risk"
            value={derived.hydropsRiskPct.toFixed(0)}
            unit="%"
            secondary="fetal failure from severe anaemia"
            colorVar="var(--danger)"
          />
          <ReadoutItem
            label="Next pregnancy risk"
            value={derived.nextPregnancySensitisationRiskPct.toFixed(0)}
            unit="%"
            secondary="if anti-D is missed at this delivery"
            colorVar="var(--transfusion)"
          />
        </>
      )}
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
