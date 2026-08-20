import { Stomach } from './Stomach';
import { SmallIntestine } from './SmallIntestine';
import { Pancreas } from './Pancreas';
import { VesselFlow } from '@/shared/components/VesselFlow/VesselFlow';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { motilityIntensity } from '../engine/motility';
import { clamp, scaleClamped } from '@/shared/lib/math';
import { GASTRIC_PH } from '../engine/constants';
import type { GiDerived } from '../engine/types';

interface GiDiagramProps {
  derived: GiDerived;
}

const ESOPHAGUS_PATH = 'M130,32 L130,88';
const EMPTYING_PATH = 'M172,148 C232,168 300,152 335,124';
const GASTRIN_PATH = 'M115,170 C82,150 82,108 112,92';
const SOMATOSTATIN_PATH = 'M148,172 C177,146 174,104 146,90';
const CCK_PATH = 'M330,138 C300,164 272,176 256,183';
const SECRETIN_PATH = 'M352,150 C338,182 314,203 288,206';

export function GiDiagram({ derived }: GiDiagramProps) {
  const acidIntensity = clamp(scaleClamped(derived.gastricPH, GASTRIC_PH.MIN_PH, 6, 1, 0), 0, 1);
  const emptyingSpeed = derived.isFasting ? 0.05 : clamp(derived.gastricEmptyingRate / 100, 0.1, 2);
  const bicarbIntensity = clamp(derived.secretinDrive, 0, 1);
  const motility = motilityIntensity(derived.isFasting, derived.motilinPhase, (derived.gastricEmptyingRate / 100) * 0.006);

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of the stomach, small intestine, and pancreas, connected by gastric emptying and the gastrin, somatostatin, CCK, and secretin hormone pathways"
      defs={
        <>
          <marker id="gastrin-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--gastrin)" />
          </marker>
          <marker id="somatostatin-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--somatostatin)" />
          </marker>
          <marker id="cck-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--cck)" />
          </marker>
          <marker id="secretin-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--secretin)" />
          </marker>
        </>
      }
    >
      <VesselFlow path={ESOPHAGUS_PATH} speed={derived.gastricVolumeFraction > 0.9 ? 1 : 0.05} colorVar="var(--motility)" />
      <VesselFlow path={EMPTYING_PATH} speed={emptyingSpeed} colorVar="var(--motility)" />

      <HormoneArrow
        path={GASTRIN_PATH}
        activation={derived.gastrinDrive}
        colorVar="var(--gastrin)"
        label="Gastrin"
        markerId="gastrin-arrow"
        labelPos={{ x: 55, y: 128 }}
      />
      <HormoneArrow
        path={SOMATOSTATIN_PATH}
        activation={derived.somatostatinDrive}
        colorVar="var(--somatostatin)"
        label="Somatostatin"
        markerId="somatostatin-arrow"
        labelPos={{ x: 195, y: 128 }}
        inhibitory
      />
      <HormoneArrow
        path={CCK_PATH}
        activation={derived.cckDrive}
        colorVar="var(--cck)"
        label="CCK"
        markerId="cck-arrow"
        labelPos={{ x: 300, y: 165 }}
      />
      <HormoneArrow
        path={SECRETIN_PATH}
        activation={derived.secretinDrive}
        colorVar="var(--secretin)"
        label="Secretin"
        markerId="secretin-arrow"
        labelPos={{ x: 388, y: 200 }}
      />

      <Stomach x={130} y={130} acidIntensity={acidIntensity} volumeFraction={derived.gastricVolumeFraction} />
      <Pancreas x={270} y={195} cckIntensity={derived.cckDrive} secretinIntensity={derived.secretinDrive} />
      <SmallIntestine x={355} y={115} bicarbIntensity={bicarbIntensity} motility={motility} />
    </DiagramFrame>
  );
}
