import { Pancreas } from './Pancreas';
import { Liver } from './Liver';
import { VesselFlow } from '@/shared/components/VesselFlow/VesselFlow';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp, scaleClamped } from '@/shared/lib/math';
import { HEPATIC } from '../engine/constants';
import styles from './Diagram.module.css';
import type { GlucoseDerived } from '../engine/types';

interface GlucoseDiagramProps {
  derived: GlucoseDerived;
}

const BLOODSTREAM_PATH = 'M96,150 C170,110 300,110 372,150';
const INSULIN_PATH = 'M120,196 C165,224 250,226 300,208';
const GLUCAGON_PATH = 'M330,178 C280,204 190,206 140,190';
const COUNTER_REG_PATH = 'M240,66 C300,52 350,84 360,122';

export function GlucoseDiagram({ derived }: GlucoseDiagramProps) {
  // Blood flow speed stands in for how much glucose is circulating.
  const bloodstreamSpeed = clamp(scaleClamped(derived.bloodGlucoseMgDl, 40, 300, 0.3, 2.2), 0.1, 2.5);
  const hepaticOutputNormalized = clamp(derived.hepaticGlucoseOutputRate / HEPATIC.MAX_OUTPUT_MGDL_PER_SECOND, 0, 1);

  return (
    <DiagramFrame
      viewBox="64 33 360 228"
      ariaLabel="Animated diagram of the pancreas and liver connected by the bloodstream, with insulin driving glucose uptake, glucagon driving hepatic glucose output, and counter-regulatory hormones engaging during hypoglycemia"
      defs={
        <>
          <marker id="insulin-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--insulin)" />
          </marker>
          <marker id="glucagon-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--glucagon)" />
          </marker>
          <marker id="counter-reg-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--epinephrine)" />
          </marker>
        </>
      }
    >
      <VesselFlow path={BLOODSTREAM_PATH} speed={bloodstreamSpeed} colorVar="var(--glucose)" />

      <HormoneArrow
        path={INSULIN_PATH}
        activation={clamp(derived.insulinLevel, 0, 1)}
        colorVar="var(--insulin)"
        label="Insulin → uptake"
        markerId="insulin-arrow"
        labelPos={{ x: 168, y: 244 }}
      />
      <HormoneArrow
        path={GLUCAGON_PATH}
        activation={derived.glucagonLevel}
        colorVar="var(--glucagon)"
        label="Glucagon → output"
        markerId="glucagon-arrow"
        labelPos={{ x: 186, y: 172 }}
      />
      <HormoneArrow
        path={COUNTER_REG_PATH}
        activation={derived.counterRegulatoryDrive}
        colorVar="var(--epinephrine)"
        label="Counter-regulation"
        markerId="counter-reg-arrow"
        labelPos={{ x: 234, y: 56 }}
      />

      <text x={240} y={128} className={styles.pathLabel} textAnchor="middle">
        bloodstream
      </text>

      <Pancreas x={110} y={200} insulinLevel={derived.insulinLevel} glucagonLevel={derived.glucagonLevel} />
      <Liver x={368} y={190} glycogenReserve={derived.hepaticGlycogenReserve} hepaticOutput={hepaticOutputNormalized} />
    </DiagramFrame>
  );
}
