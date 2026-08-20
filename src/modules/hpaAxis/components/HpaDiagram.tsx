import { Hypothalamus } from './Hypothalamus';
import { Pituitary } from './Pituitary';
import { AdrenalGland } from './AdrenalGland';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import { CORTISOL } from '../engine/constants';
import type { HpaDerived } from '../engine/types';

interface HpaDiagramProps {
  derived: HpaDerived;
}

const CRH_PATH = 'M110,84 C110,92 110,98 110,106';
const ACTH_PATH = 'M138,138 C210,158 290,178 332,190';
const CORTISOL_FEEDBACK_PATH = 'M345,178 C300,70 200,30 122,52';

export function HpaDiagram({ derived }: HpaDiagramProps) {
  const crhIntensity = clamp(derived.crhDrive, 0, 1);
  const acthIntensity = clamp(derived.acthLevel, 0, 1);
  const cortisolIntensity = clamp(derived.cortisolLevel / CORTISOL.MAX_UGDL, 0.1, 1);

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of the hypothalamic-pituitary-adrenal axis: hypothalamus releasing CRH, pituitary releasing ACTH, and the adrenal gland releasing cortisol, which feeds back to suppress the axis"
      defs={
        <>
          <marker id="crh-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--co2)" />
          </marker>
          <marker id="acth-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--acth)" />
          </marker>
          <marker id="cortisol-feedback-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--cortisol)" />
          </marker>
        </>
      }
    >
      <HormoneArrow
        path={CRH_PATH}
        activation={crhIntensity}
        colorVar="var(--co2)"
        label="CRH"
        markerId="crh-arrow"
        labelPos={{ x: 118, y: 98 }}
      />
      <HormoneArrow
        path={ACTH_PATH}
        activation={acthIntensity}
        colorVar="var(--acth)"
        label="ACTH"
        markerId="acth-arrow"
        labelPos={{ x: 230, y: 155 }}
      />
      <HormoneArrow
        path={CORTISOL_FEEDBACK_PATH}
        activation={cortisolIntensity}
        colorVar="var(--cortisol)"
        label="Cortisol feedback"
        markerId="cortisol-feedback-arrow"
        labelPos={{ x: 195, y: 34 }}
        inhibitory
      />

      <Hypothalamus x={110} y={60} crhIntensity={crhIntensity} />
      <Pituitary x={110} y={125} acthIntensity={acthIntensity} />
      <AdrenalGland x={355} y={195} cortisolIntensity={cortisolIntensity} adrenalReserve={derived.adrenalReserve} />
    </DiagramFrame>
  );
}
