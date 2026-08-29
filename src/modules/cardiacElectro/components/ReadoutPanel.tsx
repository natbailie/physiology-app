import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { CardiacDerived, CardiacInputs, CardiacPhase } from '../engine/types';

interface ReadoutPanelProps {
  derived: CardiacDerived;
  inputs: CardiacInputs;
}

const PHASE_LABELS: Record<CardiacPhase, string> = {
  filling: 'filling',
  isovolumicContraction: 'isovolumic contraction',
  ejection: 'ejection',
  isovolumicRelaxation: 'isovolumic relaxation',
};

function ejectionFractionStatus(ef: number): string {
  if (ef < 40) return 'reduced';
  if (ef < 50) return 'mid-range';
  return 'preserved';
}

export function ReadoutPanel({ derived, inputs }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      {/* The slider sets the SA node's intrinsic rate; what beats is that rate plus sympathetic
          drive and minus vagal drive, so at the default 20%/40% the tile reads four beats slower
          than the control. Disclosed rather than hidden — the gap is the autonomic lesson. */}
      <ReadoutItem
        label="Heart rate"
        value={derived.heartRateBpm.toFixed(0)}
        unit="bpm"
        setPoint={inputs.intrinsicHeartRate}
        colorVar="var(--sa-node)"
      />
      <ReadoutItem
        label="Cardiac output"
        value={derived.cardiacOutputLPerMin.toFixed(1)}
        unit="L/min"
        colorVar="var(--artery)"
      />
      <ReadoutItem label="Stroke volume" value={derived.strokeVolumeML.toFixed(0)} unit="mL" colorVar="var(--pv-loop)" />
      <ReadoutItem
        label="Ejection fraction"
        value={derived.ejectionFractionPercent.toFixed(0)}
        unit="%"
        secondary={ejectionFractionStatus(derived.ejectionFractionPercent)}
        colorVar="var(--pv-loop)"
      />
      <ReadoutItem label="EDV" value={derived.endDiastolicVolumeML.toFixed(0)} unit="mL" colorVar="var(--text)" />
      <ReadoutItem label="ESV" value={derived.endSystolicVolumeML.toFixed(0)} unit="mL" colorVar="var(--text)" />
      <ReadoutItem label="LV pressure" value={derived.lvPressureMmHg.toFixed(0)} unit="mmHg" colorVar="var(--artery)" />
      <ReadoutItem
        label="LV volume"
        value={derived.lvVolumeML.toFixed(0)}
        unit="mL"
        secondary={PHASE_LABELS[derived.phase]}
        colorVar="var(--conduction)"
      />
    </div>
  );
}
