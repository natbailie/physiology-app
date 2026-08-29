import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { BILIRUBIN } from '../engine/constants';
import type { LiverDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: LiverDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Unconjugated"
        value={derived.unconjugatedUmolL.toFixed(0)}
        unit="µmol/L"
        secondary="albumin-bound — never enters urine"
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Conjugated"
        value={derived.conjugatedUmolL.toFixed(0)}
        unit="µmol/L"
        secondary="water-soluble — spills into urine past threshold"
        colorVar="var(--liver)"
      />
      <ReadoutItem
        label="Total bilirubin"
        value={derived.totalBilirubinUmolL.toFixed(0)}
        unit="µmol/L"
        secondary={
          derived.jaundiceVisible
            ? `visible (>${BILIRUBIN.JAUNDICE_VISIBLE_UMOL_L})`
            : `normal <${BILIRUBIN.NORMAL_TOTAL_UMOL_L}`
        }
        colorVar="var(--warn)"
      />
      <ReadoutItem
        label="Conjugated fraction"
        value={derived.fractionConjugatedPct.toFixed(0)}
        unit="%"
        secondary={derived.fractionConjugatedPct > 55 ? 'obstructive picture' : derived.fractionConjugatedPct < 25 ? 'pre-hepatic picture' : 'mixed'}
        colorVar="var(--text)"
      />
      <ReadoutItem
        label="Urine bilirubin"
        value={derived.urineBilirubinPresent ? 'present' : 'absent'}
        secondary={derived.urineBilirubinPresent ? 'conjugated pigment reaching urine' : 'rules out cholestasis as cause of deep jaundice'}
        colorVar="var(--liver)"
      />
      <ReadoutItem
        label="Urine urobilinogen"
        value={`${derived.urineUrobilinogenIndex.toFixed(0)}%`}
        secondary={
          derived.urineUrobilinogenIndex > 180
            ? 'HIGH — haemolytic load'
            : derived.urineUrobilinogenIndex < 30
              ? 'ABSENT — bile never reached gut'
              : 'normal'
        }
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Stool colour"
        value={derived.stoolColourPct.toFixed(0)}
        unit="%"
        secondary={derived.stoolColourPct < 30 ? 'pale — acholic' : 'pigmented'}
        colorVar="var(--interstitium)"
      />
      <ReadoutItem
        label="ALT / ALP"
        value={`×${derived.altXUlN.toFixed(1)} / ×${derived.alpXUlN.toFixed(1)}`}
        secondary={`${derived.lftPattern} pattern · R ${derived.rFactor >= 60 ? '≥60' : derived.rFactor.toFixed(1)}`}
        colorVar="var(--nociception)"
      />
      <ReadoutItem
        label="Ammonia"
        value={derived.ammoniaUmolL.toFixed(0)}
        unit="µmol/L"
        secondary={derived.encephalopathyGrade > 0 ? `encephalopathy grade ${derived.encephalopathyGrade}` : 'cleared normally'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Kernicterus risk"
        value={derived.kernicterusRiskPct.toFixed(0)}
        unit="%"
        secondary={`unbound fraction vs albumin ${derived.albuminGPerL.toFixed(0)} g/L`}
        colorVar="var(--danger)"
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
