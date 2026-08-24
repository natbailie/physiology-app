import type { CSSProperties } from 'react';
import { Bone } from './Bone';
import { ParathyroidGlands } from './ParathyroidGlands';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { KIDNEY_PATH, SMALL_INTESTINE_PATH } from '@/shared/diagram/organShapes';
import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { CalciumDerived } from '../engine/types';

interface CalciumDiagramProps {
  derived: CalciumDerived;
}

const PTH_TO_BONE_PATH = 'M212,66 C170,92 130,140 112,176';
const PTH_TO_KIDNEY_PATH = 'M252,66 C300,92 340,120 356,148';
const CALCITRIOL_TO_GUT_PATH = 'M356,196 C330,232 290,250 258,252';
const CALCIUM_FEEDBACK_PATH = 'M120,214 C150,262 210,272 244,244';

export function CalciumDiagram({ derived }: CalciumDiagramProps) {
  const kidneyStyle = {
    '--calcitriol-level': derived.calcitriolLevel,
    '--renal-function': clamp(derived.renalFunction, 0, 1),
  } as CSSProperties;
  const gutStyle = { '--gut-absorption': clamp(derived.gutCaAbsorptionFraction / 0.45, 0, 1) } as CSSProperties;

  // Serum calcium drives the feedback arrow's intensity — high calcium suppresses PTH.
  const calciumFeedbackIntensity = clamp((derived.serumCalciumMgDl - 6) / 6, 0, 1);

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of calcium homeostasis: parathyroid glands releasing PTH which acts on bone and kidney, the kidney activating vitamin D to calcitriol which drives gut calcium absorption, and serum calcium feeding back to suppress PTH"
      defs={
        <>
          <marker id="pth-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--pth)" />
          </marker>
          <marker id="calcitriol-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--calcitriol)" />
          </marker>
          <marker id="calcium-feedback-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--calcium)" />
          </marker>
        </>
      }
    >
      <HormoneArrow
        path={PTH_TO_BONE_PATH}
        activation={derived.pthLevel}
        colorVar="var(--pth)"
        label="PTH → bone"
        markerId="pth-arrow"
        labelPos={{ x: 118, y: 108 }}
      />
      <HormoneArrow
        path={PTH_TO_KIDNEY_PATH}
        activation={derived.pthLevel}
        colorVar="var(--pth)"
        label="PTH → kidney"
        markerId="pth-arrow"
        labelPos={{ x: 300, y: 104 }}
      />
      <HormoneArrow
        path={CALCITRIOL_TO_GUT_PATH}
        activation={derived.calcitriolLevel}
        colorVar="var(--calcitriol)"
        label="Calcitriol → gut"
        markerId="calcitriol-arrow"
        labelPos={{ x: 330, y: 268 }}
      />
      <HormoneArrow
        path={CALCIUM_FEEDBACK_PATH}
        activation={calciumFeedbackIntensity}
        colorVar="var(--calcium)"
        label="Serum Ca feedback"
        markerId="calcium-feedback-arrow"
        labelPos={{ x: 116, y: 290 }}
        inhibitory
      />

      <ParathyroidGlands x={232} y={44} pthLevel={derived.pthLevel} />
      <Bone x={104} y={196} resorptionRate={derived.boneResorptionRate} />

      <g transform="translate(372, 176)" style={kidneyStyle}>
        <path className={styles.kidneyShape} d={KIDNEY_PATH} />
        <text className={styles.organLabel} y={58}>
          Kidney
        </text>
      </g>

      <g transform="translate(240, 258)" style={gutStyle}>
        <path className={styles.gutShape} d={SMALL_INTESTINE_PATH} />
        <text className={styles.organLabel} y={36}>
          Gut
        </text>
      </g>
    </DiagramFrame>
  );
}
