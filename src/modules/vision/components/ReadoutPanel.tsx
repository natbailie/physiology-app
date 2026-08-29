import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import { AQUEOUS, CLINICAL, PUPIL } from '../engine/constants';
import type { VisionDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: VisionDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem
        label="Acuity"
        value={derived.acuityLabel}
        secondary={derived.acuityDenominator > 12 ? 'resolution lost' : 'foveal cones reading'}
        colorVar="var(--retina)"
      />
      <ReadoutItem
        label="Right pupil"
        value={derived.pupilRightMm.toFixed(1)}
        unit="mm"
        secondary={
          derived.pupilRightMm > PUPIL.DARK_MM - 1 ? 'dilated' : derived.pupilRightMm < PUPIL.CONSTRICTED_MM + 1 ? 'constricted' : 'mid-position'
        }
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Left pupil"
        value={derived.pupilLeftMm.toFixed(1)}
        unit="mm"
        secondary={derived.anisocoriaMm > CLINICAL.ANISOCORIA_SIGNIFICANT_MM ? 'unequal pair' : 'equal pair'}
        colorVar="var(--artery)"
      />
      <ReadoutItem
        label="Anisocoria"
        value={derived.anisocoriaMm.toFixed(1)}
        unit="mm"
        secondary={derived.anisocoriaMm > CLINICAL.ANISOCORIA_SIGNIFICANT_MM ? 'efferent side suspect' : 'within normal'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Perceived brightness"
        value={derived.perceivedBrightness.toFixed(0)}
        unit="%"
        secondary={`${derived.regime} scene at ${derived.effectiveLuminanceLogCd >= 0 ? '+' : ''}${derived.effectiveLuminanceLogCd.toFixed(1)} log cd/m²`}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Glutamate release"
        value={(derived.glutamateRelease * 100).toFixed(0)}
        unit="%"
        secondary={derived.glutamateRelease > 0.7 ? 'dark — receptors depolarised' : 'light — receptors hyperpolarised'}
        colorVar="var(--vm)"
      />
      <ReadoutItem
        label="Rod drive"
        value={(derived.rodDrive * 100).toFixed(0)}
        unit="%"
        secondary={derived.rodDrive > 0.5 ? 'rods carrying vision' : 'rods saturated or lost'}
        colorVar="var(--vm)"
      />
      <ReadoutItem
        label="Cone drive"
        value={(derived.coneDrive * 100).toFixed(0)}
        unit="%"
        secondary={derived.coneDrive > 0.5 ? 'cones carrying vision' : 'below cone threshold'}
        colorVar="var(--o2)"
      />
      <ReadoutItem
        label="Swinging torch"
        value={Math.min(derived.directReflexRightScore, derived.directReflexLeftScore).toFixed(0)}
        unit="%"
        secondary={derived.rapdPositive ? 'RAPD — weaker from left eye' : 'direct = consensual'}
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Intraocular pressure"
        value={derived.intraocularPressureMmHg.toFixed(0)}
        unit="mmHg"
        secondary={
          derived.intraocularPressureMmHg >= AQUEOUS.CRISIS_IOP_MMHG
            ? 'crisis — painful red eye'
            : derived.intraocularPressureMmHg >= AQUEOUS.GLAUCOMA_IOP_MMHG
              ? 'raised — glaucoma range'
              : 'normal range'
        }
        colorVar={derived.intraocularPressureMmHg >= AQUEOUS.GLAUCOMA_IOP_MMHG ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Angle closure"
        value={(derived.angleClosureFraction * 100).toFixed(0)}
        unit="%"
        secondary={
          derived.angleClosureFraction > 0.5
            ? 'iris in the meshwork'
            : derived.angleClosureFraction > 0.05
              ? 'narrow, threatened'
              : 'angle open'
        }
        colorVar="var(--danger)"
      />
      <ReadoutItem
        label="Accommodation"
        value={`×${derived.accommodativeResponseD.toFixed(1)}`}
        unit="D"
        secondary={
          derived.blurActive
            ? `blurred — ${derived.accommodationDeficitD.toFixed(1)} D short`
            : `demand ${derived.accommodationDemandD.toFixed(1)} D met`
        }
        colorVar={derived.blurActive ? 'var(--danger)' : 'var(--text)'}
      />
      <ReadoutItem
        label="Near point"
        value={derived.nearPointCm.toFixed(0)}
        unit="cm"
        secondary={`convergence ${derived.convergenceDemandPrismD.toFixed(0)} Δ`}
        colorVar="var(--text)"
      />
      <ReadoutItem
        label="Visual fields"
        value={derived.fieldDefectLabel}
        secondary={derived.maculaSpared ? 'central vision spared' : undefined}
        colorVar={derived.fieldDefectLabel === 'no field defect' ? 'var(--text)' : 'var(--danger)'}
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
