import type { CSSProperties } from 'react';
import { Sarcomere } from './Sarcomere';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp, scaleClamped } from '@/shared/lib/math';
import { TENSION } from '../engine/constants';
import styles from './Diagram.module.css';
import type { MuscleDerived } from '../engine/types';

interface MuscleDiagramProps {
  derived: MuscleDerived;
  /** Excitation signal at the triad — glows the T-tubule as each stimulus arrives. */
  excitationPulse: number;
}

/** Scattered cytosolic calcium ions. Each becomes visible at its own concentration threshold,
 * so the cloud thickens and thins with the transient rather than merely fading. */
const CALCIUM_IONS = [
  { x: 150, y: 128, threshold: 0.15 },
  { x: 196, y: 118, threshold: 0.45 },
  { x: 244, y: 124, threshold: 0.3 },
  { x: 292, y: 116, threshold: 0.6 },
  { x: 338, y: 128, threshold: 0.9 },
  { x: 172, y: 232, threshold: 0.25 },
  { x: 220, y: 240, threshold: 0.55 },
  { x: 268, y: 234, threshold: 0.8 },
  { x: 316, y: 242, threshold: 1.1 },
  { x: 364, y: 230, threshold: 1.4 },
];

const TENSION_BAR = { x: 60, y: 268, width: 360, height: 10 };

export function MuscleDiagram({ derived, excitationPulse }: MuscleDiagramProps) {
  const srFillHeight = clamp(derived.srCalciumLoad, 0, 1) * 34;
  const activeWidth = clamp(derived.activeTension / TENSION.MAX_PERCENT, 0, 1) * TENSION_BAR.width;
  const passiveWidth = clamp(derived.passiveTension / TENSION.MAX_PERCENT, 0, 1) * TENSION_BAR.width;

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of a sarcomere: calcium released from the sarcoplasmic reticulum, cross-bridges forming where thick and thin filaments overlap, and the tension that results"
    >
      {/* Sarcoplasmic reticulum, with its calcium store drawn as a fill level. */}
      <rect className={styles.srBody} x={30} y={62} width={26} height={38} rx={4} />
      <rect className={styles.srFill} x={32} y={98 - srFillHeight} width={22} height={srFillHeight} rx={3} />
      <text className={styles.pathLabel} x={20} y={54}>
        SR store
      </text>
      <text className={styles.valueLabel} x={43} y={114}>
        {(derived.srCalciumLoad * 100).toFixed(0)}%
      </text>

      {/* T-tubule carrying the action potential down to the triad. */}
      <line
        className={styles.tTubule}
        style={{ '--excitation': clamp(excitationPulse, 0, 1) } as CSSProperties}
        x1={96}
        y1={58}
        x2={96}
        y2={250}
      />
      <text className={styles.pathLabel} x={72} y={50}>
        T-tubule
      </text>

      {CALCIUM_IONS.map((ion) => (
        <circle
          key={`${ion.x}-${ion.y}`}
          className={styles.calciumIon}
          style={{ '--visible': derived.cytosolicCalciumUM >= ion.threshold ? 1 : 0 } as CSSProperties}
          cx={ion.x}
          cy={ion.y}
          r={3.2}
        />
      ))}
      <text className={styles.pathLabel} x={150} y={100}>
        Cytosolic Ca2+ {derived.cytosolicCalciumUM.toFixed(2)} uM
      </text>

      <Sarcomere centerX={252} centerY={178} lengthUm={derived.sarcomereLengthUm} attachedFraction={derived.activeCrossBridgeFraction} />

      <text className={styles.valueLabel} x={252} y={228}>
        {derived.sarcomereLengthUm.toFixed(2)} um · overlap {(derived.lengthTensionFactor * 100).toFixed(0)}%
      </text>

      {/* Tension gauge: active tension, with passive tension stacked on top of it. */}
      <text className={styles.pathLabel} x={60} y={262}>
        Tension — {derived.contractionMode}
      </text>
      <rect className={styles.tensionTrack} x={TENSION_BAR.x} y={TENSION_BAR.y} width={TENSION_BAR.width} height={TENSION_BAR.height} rx={5} />
      <rect className={styles.tensionActive} x={TENSION_BAR.x} y={TENSION_BAR.y} width={activeWidth} height={TENSION_BAR.height} rx={5} />
      <rect
        className={styles.tensionPassive}
        x={TENSION_BAR.x + activeWidth}
        y={TENSION_BAR.y}
        width={passiveWidth}
        height={TENSION_BAR.height}
        rx={5}
      />
      <text className={styles.valueLabel} x={440} y={277}>
        {derived.totalTension.toFixed(0)}%
      </text>

      <text className={styles.rigorBadge} style={{ '--rigor': derived.isInRigor ? 1 : 0 } as CSSProperties} x={400} y={120}>
        Rigor — no ATP
      </text>
      <text className={styles.latchBadge} style={{ '--latched': derived.isLatched ? 1 : 0 } as CSSProperties} x={400} y={138}>
        Latch state
      </text>
      <text className={styles.pathLabel} x={356} y={54}>
        {derived.muscleType}
      </text>
      <text className={styles.pathLabel} x={356} y={70}>
        {derived.isFused ? 'fused tetanus' : derived.isTetanic ? 'summating' : 'twitch'}
      </text>
      <text className={styles.pathLabel} x={356} y={86}>
        {scaleClamped(derived.temperatureC, 37, 42, 0, 1) > 0.3 ? `${derived.temperatureC.toFixed(1)} C` : ''}
      </text>
    </DiagramFrame>
  );
}
