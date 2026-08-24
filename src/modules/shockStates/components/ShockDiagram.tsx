import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { ShockDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface ShockDiagramProps {
  derived: ShockDerived;
}

/** Path the flow pips follow: veins to right heart, through the lungs, left heart, arteries,
 * tissue, and back. Four lesion sites sit at four different points on this one loop. */
const LOOP =
  'M 120 250 L 120 170 L 210 170 L 210 110 L 350 110 L 350 170 L 440 170 L 440 250 L 440 310 L 280 310 L 120 310 Z';

export function ShockDiagram({ derived }: ShockDiagramProps) {
  const transitSeconds = clamp(18 / Math.max(derived.cardiacOutputLPerMin, 0.4), 1.2, 26);

  const style = {
    '--cvp-fill': clamp(derived.centralVenousPressureMmHg / 18, 0, 1),
    '--wedge-fill': clamp(derived.wedgePressureMmHg / 28, 0, 1),
    '--pvr-block': clamp((derived.pulmonaryVascularResistance - 1) / 8, 0, 1),
    '--transit-seconds': transitSeconds,
  } as CSSProperties;

  const lesion = (opacity: number) => ({ '--lesion-opacity': clamp(opacity, 0, 1) }) as CSSProperties;

  const volumeDeficit = clamp((5000 - derived.bloodVolumeMl) / 2000, 0, 1);
  const pumpFailure = clamp((1 - derived.contractility) / 0.8, 0, 1);
  const obstruction = clamp(
    Math.max((derived.pulmonaryVascularResistance - 1) / 6, derived.pericardialPressureMmHg / 16),
    0,
    1,
  );
  const vasodilatation = clamp((1 - derived.systemicVascularResistance) / 0.7, 0, 1);

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="Circulatory loop showing where each shock state acts">
      <g style={style}>
        <path className={styles.vessel} d={LOOP} />

        {/* Right heart — filled in proportion to central venous pressure. */}
        <rect className={styles.rightHeart} x={185} y={140} width={60} height={60} rx={8} />
        <text className={styles.label} x={175} y={132}>
          RIGHT
        </text>
        <text className={styles.value} x={175} y={228}>
          CVP {derived.centralVenousPressureMmHg.toFixed(0)}
        </text>

        {/* Lungs — the obstruction in embolism sits here, between the two pressures. */}
        <path className={styles.lungs} d="M 260 110 q 20 -30 40 0 q 20 30 40 0" />
        <text className={styles.label} x={262} y={86}>
          LUNGS
        </text>

        {/* Left heart — filled in proportion to wedge pressure. */}
        <rect className={styles.leftHeart} x={410} y={140} width={60} height={60} rx={8} />
        <text className={styles.label} x={404} y={132}>
          LEFT
        </text>
        <text className={styles.value} x={392} y={228}>
          Wedge {derived.wedgePressureMmHg.toFixed(0)}
        </text>

        <path className={styles.tissue} d="M 240 290 h 90" />
        <text className={styles.label} x={244} y={336}>
          TISSUE
        </text>

        {/* Lesion markers. Each fades in only when that mechanism is actually contributing,
            so the diagram shows WHERE the problem is rather than merely that there is one. */}
        <g style={lesion(volumeDeficit)}>
          <circle className={styles.lesion} cx={120} cy={280} r={6} />
          <text className={styles.lesionLabel} x={40} y={284}>
            VOLUME
          </text>
        </g>
        <g style={lesion(pumpFailure)}>
          <circle className={styles.lesion} cx={440} cy={205} r={6} />
          <text className={styles.lesionLabel} x={478} y={209}>
            PUMP
          </text>
        </g>
        <g style={lesion(obstruction)}>
          <circle className={styles.lesion} cx={300} cy={110} r={6} />
          <text className={styles.lesionLabel} x={318} y={100}>
            OBSTRUCTION
          </text>
        </g>
        <g style={lesion(vasodilatation)}>
          <circle className={styles.lesion} cx={285} cy={310} r={6} />
          <text className={styles.lesionLabel} x={300} y={330}>
            VASODILATATION
          </text>
        </g>

        <circle className={styles.flowPip} r={4} style={{ offsetPath: `path("${LOOP}")` } as CSSProperties} />

        <text className={styles.caption} x={40} y={40}>
          Cardiac index {derived.cardiacIndex.toFixed(1)} · SvO₂ {derived.mixedVenousSaturationPercent.toFixed(0)}% · lactate{' '}
          {derived.lactateMmolL.toFixed(1)}
        </text>
        <text className={styles.verdict} x={40} y={378}>
          {derived.classification}
        </text>
        <DiagramText
        className={styles.label}
        x={40}
        y={396}
        maxWidth={504}
        fontSize={11}
        tracking={0.06}
      >
        {derived.patternSummary}
      </DiagramText>
      </g>
    </DiagramFrame>
  );
}
