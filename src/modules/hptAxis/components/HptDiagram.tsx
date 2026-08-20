import { Hypothalamus } from './Hypothalamus';
import { Pituitary } from './Pituitary';
import { ThyroidGland } from './ThyroidGland';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import { T4 } from '../engine/constants';
import type { HptDerived } from '../engine/types';

interface HptDiagramProps {
  derived: HptDerived;
}

const TRH_PATH = 'M110,84 C110,92 110,98 110,106';
const TSH_PATH = 'M138,138 C210,158 290,178 332,190';
const T4T3_FEEDBACK_PATH = 'M345,178 C300,70 200,30 122,52';

export function HptDiagram({ derived }: HptDiagramProps) {
  const trhIntensity = clamp(derived.trhDrive, 0, 1);
  const tshIntensity = clamp(derived.tshLevel, 0, 1);
  const thyroidIntensity = clamp(derived.t4Level / T4.MAX_UGDL, 0.1, 1);

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of the hypothalamic-pituitary-thyroid axis: hypothalamus releasing TRH, pituitary releasing TSH, and the thyroid gland releasing T4/T3, which feeds back to suppress the axis"
      defs={
        <>
          <marker id="trh-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--co2)" />
          </marker>
          <marker id="tsh-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--tsh)" />
          </marker>
          <marker id="t4t3-feedback-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--thyroid)" />
          </marker>
        </>
      }
    >
      <HormoneArrow
        path={TRH_PATH}
        activation={trhIntensity}
        colorVar="var(--co2)"
        label="TRH"
        markerId="trh-arrow"
        labelPos={{ x: 118, y: 98 }}
      />
      <HormoneArrow
        path={TSH_PATH}
        activation={tshIntensity}
        colorVar="var(--tsh)"
        label="TSH"
        markerId="tsh-arrow"
        labelPos={{ x: 230, y: 155 }}
      />
      <HormoneArrow
        path={T4T3_FEEDBACK_PATH}
        activation={thyroidIntensity}
        colorVar="var(--thyroid)"
        label="T4/T3 feedback"
        markerId="t4t3-feedback-arrow"
        labelPos={{ x: 190, y: 34 }}
        inhibitory
      />

      <Hypothalamus x={110} y={60} trhIntensity={trhIntensity} />
      <Pituitary x={110} y={125} tshIntensity={tshIntensity} />
      <ThyroidGland x={355} y={195} thyroidIntensity={thyroidIntensity} conversionEfficiency={derived.conversionEfficiency} />
    </DiagramFrame>
  );
}
