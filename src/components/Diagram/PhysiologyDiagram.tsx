import { Heart } from './Heart';
import { Kidneys } from './Kidneys';
import { VesselFlow } from './VesselFlow';
import { HormoneArrow } from './HormoneArrow';
import styles from './Diagram.module.css';
import { HEMODYNAMICS, RENAL } from '@/simulation/constants';
import { clamp } from '@/simulation/math';
import type { DerivedValues } from '@/simulation/types';

interface PhysiologyDiagramProps {
  derived: DerivedValues;
}

const ARTERIAL_PATH = 'M148,130 C220,70 310,70 345,110';
const VENOUS_PATH = 'M345,190 C310,235 220,235 148,175';
const RAAS_PATH = 'M345,205 C285,268 195,268 148,192';
const ANP_PATH = 'M148,108 C195,42 290,42 345,88';

export function PhysiologyDiagram({ derived }: PhysiologyDiagramProps) {
  const strokeVolumeScale = clamp(derived.strokeVolume / HEMODYNAMICS.BASELINE_STROKE_VOLUME_ML, 0.5, 1.6);
  const flowSpeed = clamp(derived.cardiacOutput / HEMODYNAMICS.CO_BASELINE_ML_PER_MIN, 0.05, 2.5);
  const renalFlowSpeed = clamp(derived.renalBloodFlow, 0.05, 2.5);
  const gfrIntensity = clamp(derived.gfr / RENAL.BASELINE_GFR, 0, 1.8);
  const urineSpeed = clamp(derived.urineOutput / RENAL.BASELINE_URINE_TARGET, 0.05, 2.5);

  return (
    <div className={styles.panel}>
      <svg
        className={styles.screen}
        viewBox="0 0 480 300"
        role="img"
        aria-label="Animated diagram of the heart and kidneys, connected by blood flow and the RAAS and ANP hormone pathways"
      >
        <defs>
          <marker id="raas-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--raas)" />
          </marker>
          <marker id="anp-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--anp)" />
          </marker>
        </defs>

        <VesselFlow path={ARTERIAL_PATH} speed={flowSpeed} colorVar="var(--artery)" />
        <VesselFlow path={VENOUS_PATH} speed={flowSpeed} colorVar="var(--artery)" />
        <VesselFlow path="M370,132 L370,168" speed={renalFlowSpeed} colorVar="var(--kidney)" />

        <HormoneArrow
          path={ANP_PATH}
          activation={derived.anpLevel}
          colorVar="var(--anp)"
          label="ANP"
          markerId="anp-arrow"
          labelPos={{ x: 200, y: 40 }}
        />
        <HormoneArrow
          path={RAAS_PATH}
          activation={derived.raasActivation}
          colorVar="var(--raas)"
          label="RAAS"
          markerId="raas-arrow"
          labelPos={{ x: 260, y: 285 }}
        />

        <Heart x={110} y={150} effectiveHeartRate={derived.effectiveHeartRate} strokeVolumeScale={strokeVolumeScale} />
        <Kidneys x={370} y={100} gfrIntensity={gfrIntensity} urineSpeed={urineSpeed} />
      </svg>
    </div>
  );
}
