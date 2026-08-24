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
        value={derived.crossmatchVerdict.startsWith('MAJOR') ? 'MAJOR MISMATCH' : derived.crossmatchVerdict.startsWith('Rh') ? 'Rh mismatch' : 'compatible'}
        secondary={`${derived.donorType} unit into ${derived.recipientType} recipient`}
        colorVar={derived.crossmatchVerdict.startsWith('MAJOR') ? 'var(--danger)' : 'var(--ok)'}
      />
      <ReadoutItem
        label="Reaction arm"
        value={
          derived.reactionArm === 'none'
            ? 'none'
            : derived.reactionArm.startsWith('immediate')
              ? 'intravascular IgM'
              : 'extravascular IgG'
        }
        secondary={derived.aboIncompatible ? 'preformed antibodies — minutes' : derived.rhIncompatible ? 'acquired antibodies — days' : 'no antigen meeting'}
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
