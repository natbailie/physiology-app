import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { PROLACTIN_AXIS } from '../engine/constants';
import type { PituitaryDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: PituitaryDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="GH"
        value={derived.ghNgMl.toFixed(1)}
        unit="ng/mL"
        secondary={derived.ghNgMl > 10 ? 'autonomous — ignores hypothalamus' : 'under hypothalamic control'}
        colorVar="var(--basal-ganglia)"
      />
      <ReadoutItem
        label="IGF-1"
        value={derived.igf1NgMl.toFixed(0)}
        unit="ng/mL"
        secondary="the integrated screening value"
        colorVar="var(--ok)"
      />
      <ReadoutItem
        label="Prolactin"
        value={derived.prolactinNgMl.toFixed(0)}
        unit="ng/mL"
        secondary={
          derived.prolactinNgMl >= PROLACTIN_AXIS.MACROADENOMA_LIKELY_NG_ML
            ? 'macroadenoma range'
            : derived.prolactinNgMl > PROLACTIN_AXIS.UPPER_LIMIT_NG_ML
              ? 'raised — ask WHY before scanning'
              : 'under dopamine brake'
        }
        colorVar="var(--ige)"
      />
      <ReadoutItem
        label="Glucose suppression test"
        value={derived.glucoseSuppressionTest}
        secondary="GH <1 ng/mL is the normal response"
        colorVar="var(--warn)"
      />
      <ReadoutItem
        label="Dopamine brake"
        value={(derived.effectiveDopamineFraction * 100).toFixed(0)}
        unit="%"
        secondary={`stalk compressed ${(derived.stalkCompressionFraction * 100).toFixed(0)}%`}
        colorVar="var(--pituitary)"
      />
      <ReadoutItem
        label="Sellar mass"
        value={derived.totalMassCc.toFixed(1)}
        unit="cm³"
        secondary={derived.visualFieldDefectPct > 5 ? `fields lost ${derived.visualFieldDefectPct.toFixed(0)}%` : 'chiasma clear'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Gonadal axis"
        value={`${100 - derived.gonadalSuppressionPct}%`}
        secondary="prolactin suppresses GnRH downstream of nothing"
        colorVar="var(--lh)"
      />
      <ReadoutItem
        label="Somatic effect"
        value={
          derived.heightVelocityCmPerYear > 0
            ? `${derived.heightVelocityCmPerYear.toFixed(1)} cm/yr`
            : `${derived.acromegalicIndex.toFixed(0)}/100`
        }
        secondary={derived.heightVelocityCmPerYear > 8 ? 'linear growth (open epiphyses)' : 'acral overgrowth index'}
        colorVar="var(--sarcomere)"
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
