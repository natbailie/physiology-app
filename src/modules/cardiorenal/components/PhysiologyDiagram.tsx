import { Heart } from './Heart';
import { Kidneys } from './Kidneys';
import { VesselFlow } from '@/shared/components/VesselFlow/VesselFlow';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { HEMODYNAMICS, RENAL } from '../engine/constants';
import { clamp } from '@/shared/lib/math';
import type { DerivedValues } from '../engine/types';

interface PhysiologyDiagramProps {
  derived: DerivedValues;
}

const ARTERIAL_PATH = 'M148,130 C220,70 310,70 345,110';
const VENOUS_PATH = 'M345,190 C310,235 220,235 148,175';
/* RAAS reaches the circulation by two routes with two different clocks, and the module turns on
 * the difference: angiotensin II squeezes the vessels within seconds, aldosterone rebuilds volume
 * at the tubule over hours. One arrow to one destination could not say that, so there are two. */
const ANGIOTENSIN_PATH = 'M338,214 C300,258 232,246 214,196';
const ALDOSTERONE_PATH = 'M392,214 C420,250 400,268 376,236';
const ANP_PATH = 'M148,108 C195,42 290,42 345,88';

export function PhysiologyDiagram({ derived }: PhysiologyDiagramProps) {
  const strokeVolumeScale = clamp(derived.strokeVolume / HEMODYNAMICS.BASELINE_STROKE_VOLUME_ML, 0.5, 1.6);
  const flowSpeed = clamp(derived.cardiacOutput / HEMODYNAMICS.CO_BASELINE_ML_PER_MIN, 0.05, 2.5);
  const renalFlowSpeed = clamp(derived.renalBloodFlow, 0.05, 2.5);
  // Calibre falls as angiotensin II constricts, so the resistance term is a visible narrowing
  // rather than only a number in the readouts.
  const arterialCalibre = clamp(1 / Math.max(derived.effectiveSVR, 0.3), 0.45, 1.8);
  const gfrIntensity = clamp(derived.gfr / RENAL.BASELINE_GFR, 0, 1.8);
  const urineSpeed = clamp(derived.urineOutput / RENAL.BASELINE_URINE_TARGET, 0.05, 2.5);

  return (
    <DiagramFrame
      viewBox="56 17 419 284"
      ariaLabel="Animated diagram of the heart and kidneys, connected by blood flow and the RAAS and ANP hormone pathways"
      defs={
        <>
          <marker id="raas-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--raas)" />
          </marker>
          <marker id="anp-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--anp)" />
          </marker>
        </>
      }
    >
      <VesselFlow path={ARTERIAL_PATH} speed={flowSpeed} colorVar="var(--artery)" width={arterialCalibre} />
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
      {/* Angiotensin II acts on the ARTERIES — the resistance term, and it acts at once. */}
      <HormoneArrow
        path={ANGIOTENSIN_PATH}
        activation={derived.angiotensinII}
        colorVar="var(--raas)"
        label="Angiotensin II"
        markerId="raas-arrow"
        labelPos={{ x: 232, y: 262 }}
      />
      {/* Aldosterone acts on the TUBULE — the volume term, and it takes hours. */}
      <HormoneArrow
        path={ALDOSTERONE_PATH}
        activation={derived.aldosterone}
        colorVar="var(--raas)"
        label="Aldosterone"
        markerId="raas-arrow"
        labelPos={{ x: 398, y: 284 }}
      />

      <Heart x={110} y={150} effectiveHeartRate={derived.effectiveHeartRate} strokeVolumeScale={strokeVolumeScale} />
      <Kidneys x={370} y={100} gfrIntensity={gfrIntensity} urineSpeed={urineSpeed} />
    </DiagramFrame>
  );
}
