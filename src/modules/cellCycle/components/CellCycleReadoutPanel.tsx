import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { CellCycleDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: CellCycleDerived;
}

export function CellCycleReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Current phase"
        value={derived.phase}
        secondary={`${(derived.phaseDurationH * (1 - derived.phaseProgress)).toFixed(1)} h remaining`}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Cycling"
        value={derived.cyclingRatePct.toFixed(0)}
        unit="% of population"
        secondary={derived.cyclingRatePct > 0 ? 'progressing normally' : 'halted at a checkpoint'}
        colorVar="var(--conduction-path)"
      />
      <ReadoutItem
        label="Doubling time"
        value={derived.doublingTimeH > 9998 ? '∞' : derived.doublingTimeH.toFixed(0)}
        unit={derived.doublingTimeH > 9998 ? undefined : 'h'}
        secondary={derived.doublingTimeH > 9998 ? 'no net proliferation' : 'at current pace'}
        colorVar="var(--repolarizing)"
      />
      <ReadoutItem
        label="Cyclin D drive"
        value={derived.cyclinDDrivePct.toFixed(0)}
        unit="%"
        secondary="restriction-point signal"
        colorVar="var(--potassium)"
      />
      <ReadoutItem
        label="p53 activity"
        value={derived.p53ActivityPct.toFixed(0)}
        unit="%"
        secondary="guardian engaged above damage threshold"
        colorVar="var(--thermal)"
      />
      <ReadoutItem
        label="Lesion load"
        value={derived.lesionLoadPct.toFixed(0)}
        unit="%"
        secondary={`insult input ${(derived.dnaDamage * 100).toFixed(0)}%`}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Apoptosis"
        value={derived.apoptoticFractionPct.toFixed(1)}
        unit="% of cohort"
        colorVar="var(--fibrin)"
      />
    </div>
  );
}
