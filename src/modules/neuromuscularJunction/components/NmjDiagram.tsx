import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import { ENDPLATE } from '../engine/constants';
import { receptorAvailability } from '../engine/transmission';
import type { NmjDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface NmjDiagramProps {
  derived: NmjDerived;
}

const EPP_PLOT = { x: 330, y: 60, width: 40, height: 150 };
const TRAIN_PLOT = { x: 400, y: 60, width: 130, height: 150 };

export function NmjDiagram({ derived }: NmjDiagramProps) {
  const availability = receptorAvailability(derived, derived.desensitisation);

  const style = {
    '--pool': clamp(0.15 + derived.vesiclePool * 0.85, 0, 1),
    '--availability': clamp(availability, 0, 1),
  } as CSSProperties;

  // Both the end-plate potential and the threshold are drawn on one axis, so the reserve
  // between them is a distance rather than a number.
  const scale = (mv: number) => clamp(mv / ENDPLATE.MAX_EPP_MV, 0, 1) * EPP_PLOT.height;
  const eppHeight = scale(derived.endPlatePotentialMv);
  const thresholdY = EPP_PLOT.y + EPP_PLOT.height - scale(ENDPLATE.THRESHOLD_MV);

  const barWidth = TRAIN_PLOT.width / 4 - 8;

  return (
    <DiagramFrame viewBox="0 0 560 400" ariaLabel="Neuromuscular junction with end-plate potential and train-of-four">
      <g style={style}>
        {/* Nerve terminal with its vesicle pool */}
        <path className={styles.terminal} d="M 40 90 h 210 v 90 h -210 z" />
        <text className={styles.label} x={40} y={82}>
          NERVE TERMINAL
        </text>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <circle
            key={i}
            className={styles.vesicle}
            cx={64 + (i % 4) * 46}
            cy={122 + Math.floor(i / 4) * 34}
            r={7}
          />
        ))}

        <path className={styles.cleft} d="M 40 196 h 210" />
        <text className={styles.label} x={40} y={212}>
          CLEFT
        </text>

        {/* Post-synaptic membrane: receptor availability drawn as opacity */}
        <path className={styles.fibre} d="M 40 240 h 210" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} className={styles.receptor} d={`M ${58 + i * 36} 240 v -14 h 14 v 14`} />
        ))}
        <text className={styles.label} x={40} y={262}>
          MUSCLE END PLATE
        </text>

        {/* End-plate potential against threshold */}
        <rect
          className={styles.eppBar}
          x={EPP_PLOT.x}
          y={EPP_PLOT.y + EPP_PLOT.height - eppHeight}
          width={EPP_PLOT.width}
          height={eppHeight}
        />
        <line
          className={styles.thresholdLine}
          x1={EPP_PLOT.x - 6}
          x2={EPP_PLOT.x + EPP_PLOT.width + 6}
          y1={thresholdY}
          y2={thresholdY}
        />
        <text className={styles.label} x={EPP_PLOT.x - 4} y={EPP_PLOT.y - 10}>
          EPP
        </text>
        <text className={styles.label} x={EPP_PLOT.x - 4} y={EPP_PLOT.y + EPP_PLOT.height + 16}>
          {derived.endPlatePotentialMv.toFixed(0)} mV
        </text>

        {/* Train-of-four */}
        {derived.trainOfFour.map((response, i) => {
          const height = clamp(response, 0, 1) * TRAIN_PLOT.height;
          return (
            <rect
              key={i}
              className={styles.trainBar}
              x={TRAIN_PLOT.x + i * (TRAIN_PLOT.width / 4)}
              y={TRAIN_PLOT.y + TRAIN_PLOT.height - height}
              width={barWidth}
              height={height}
            />
          );
        })}
        <text className={styles.label} x={TRAIN_PLOT.x} y={EPP_PLOT.y - 10}>
          TRAIN OF FOUR
        </text>
        <text className={styles.label} x={TRAIN_PLOT.x} y={TRAIN_PLOT.y + TRAIN_PLOT.height + 16}>
          ratio {derived.trainOfFourRatio.toFixed(2)}
        </text>

        <text className={styles.caption} x={40} y={310}>
          safety factor {derived.safetyFactor.toFixed(2)} · force{' '}
          {derived.muscleForcePercent.toFixed(0)}% · high-rate response{' '}
          {derived.postTetanicRatio.toFixed(2)}x
        </text>
        <text className={styles.verdict} x={40} y={352}>
          {derived.classification}
        </text>
        <text className={styles.label} x={40} y={372}>
          {derived.patternSummary}
        </text>
      </g>
    </DiagramFrame>
  );
}
