import { Lungs } from './Lungs';
import { RenalCompensationOrgan } from './RenalCompensationOrgan';
import { VesselFlow } from '@/shared/components/VesselFlow/VesselFlow';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { RespDerived } from '../engine/types';

interface RespiratoryDiagramProps {
  derived: RespDerived;
}

const BLOOD_GAS_PATH = 'M240,168 L240,250';
const CHEMORECEPTOR_PATH = 'M225,58 C180,20 130,10 95,28';
const RENAL_PATH = 'M355,190 C300,150 275,125 250,110';

export function RespiratoryDiagram({ derived }: RespiratoryDiagramProps) {
  const breathRate = clamp((derived.effectiveMinuteVentilation / 100) * 14, 3, 60);
  const ventDepth = clamp(derived.alveolarVentilationFraction, 0.5, 1.6);
  const bloodGasSpeed = clamp(derived.saO2 / 100, 0.1, 2);
  const hco3Intensity = clamp(derived.plasmaHCO3 / 24, 0.2, 1.8);
  const chemoActivation = clamp((derived.chemoreceptorDrive + 1) / 2, 0, 1);
  const renalActivation = clamp((derived.renalCompensationDrive + 1) / 2, 0, 1);

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of the lungs and kidneys, connected by gas exchange, the chemoreceptor reflex, and renal bicarbonate compensation"
      defs={
        <>
          <marker id="chemo-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--co2)" />
          </marker>
          <marker id="renal-comp-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--bicarb)" />
          </marker>
        </>
      }
    >
      <VesselFlow path={BLOOD_GAS_PATH} speed={bloodGasSpeed} colorVar="var(--o2)" />

      <HormoneArrow
        path={CHEMORECEPTOR_PATH}
        activation={chemoActivation}
        colorVar="var(--co2)"
        label="Chemoreceptors"
        markerId="chemo-arrow"
        labelPos={{ x: 95, y: 22 }}
      />
      <HormoneArrow
        path={RENAL_PATH}
        activation={renalActivation}
        colorVar="var(--bicarb)"
        label="Renal HCO3-"
        markerId="renal-comp-arrow"
        labelPos={{ x: 300, y: 252 }}
      />

      <Lungs x={240} y={100} breathRate={breathRate} ventDepth={ventDepth} vqMismatch={derived.vqMismatch} />
      <RenalCompensationOrgan x={355} y={220} hco3Intensity={hco3Intensity} />

      <text x={240} y={264} className={styles.pathLabel} textAnchor="middle">
        tissues
      </text>
    </DiagramFrame>
  );
}
