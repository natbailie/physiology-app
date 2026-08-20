import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp, scaleClamped } from '@/shared/lib/math';
import { VENTRICLE } from '../engine/constants';
import styles from './Diagram.module.css';
import type { CardiacDerived, CardiacPhase } from '../engine/types';

interface CardiacDiagramProps {
  derived: CardiacDerived;
}

const PHASE_LABELS: Record<CardiacPhase, string> = {
  filling: 'Filling',
  isovolumicContraction: 'Isovolumic contraction',
  ejection: 'Ejection',
  isovolumicRelaxation: 'Isovolumic relaxation',
};

export function CardiacDiagram({ derived }: CardiacDiagramProps) {
  // Chamber radius tracks actual ventricular volume, so the diagram contracts as it ejects.
  const chamberRadius = scaleClamped(derived.lvVolumeML, VENTRICLE.MIN_VOLUME_ML, 220, 20, 52);
  const chamberStyle = {
    '--chamber-pressure': clamp(derived.lvPressureMmHg / 160, 0, 1),
  } as CSSProperties;

  // The SA node fires at the very start of the cycle; the AV node after the conduction delay.
  const cycleDurationMs = (60 / Math.max(derived.heartRateBpm, 1)) * 1000;
  const avDelayFraction = clamp(derived.avConductionDelay / cycleDurationMs, 0, 0.5);
  const saActivation = clamp(1 - derived.cyclePhaseFraction / 0.08, 0, 1);
  const avActivation = clamp(1 - Math.abs(derived.cyclePhaseFraction - avDelayFraction) / 0.06, 0, 1);

  const mitralOpen = derived.phase === 'filling';
  const aorticOpen = derived.phase === 'ejection';

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of the cardiac cycle: the SA and AV nodes firing in sequence, the left ventricle contracting and relaxing, and the mitral and aortic valves opening and shutting through the four phases"
    >
      <text className={styles.pathLabel} x={22} y={28}>
        Conduction
      </text>
      <path className={styles.conductionPath} d="M96,60 C130,78 150,96 158,118" />
      <path className={styles.conductionPath} d="M158,130 C170,160 176,180 178,200" />

      <g transform="translate(92, 54)" style={{ '--node-activation': saActivation } as CSSProperties}>
        <circle className={styles.node} r={11} />
        <text className={styles.organLabel} y={-18}>
          SA node
        </text>
      </g>

      <g transform="translate(158, 124)" style={{ '--node-activation': avActivation } as CSSProperties}>
        <circle className={styles.node} r={9} />
        <text className={styles.organLabel} x={-34} y={4}>
          AV
        </text>
      </g>

      <text className={styles.pathLabel} x={186} y={128}>
        PR {derived.avConductionDelay} ms
      </text>
      {derived.isHeartBlock && (
        <text className={styles.pathLabel} x={186} y={144} fill="var(--danger)">
          Complete block
        </text>
      )}

      {/* Left ventricle: radius tracks volume, fill tracks pressure. */}
      <g transform="translate(320, 168)" style={chamberStyle}>
        <circle className={styles.ventricleChamber} r={chamberRadius} />
        <circle className={styles.ventricleWall} r={chamberRadius} />
        <text className={styles.organLabel} y={82}>
          Left ventricle
        </text>
      </g>

      {/* Valves: shown solid when shut, faded when open. */}
      <line className={mitralOpen ? styles.valveOpen : styles.valveShut} x1={272} y1={116} x2={300} y2={128} />
      <text className={styles.pathLabel} x={228} y={112}>
        Mitral
      </text>
      <line className={aorticOpen ? styles.valveOpen : styles.valveShut} x1={342} y1={122} x2={370} y2={110} />
      <text className={styles.pathLabel} x={376} y={104}>
        Aortic
      </text>

      <text className={styles.phaseBadge} x={22} y={252}>
        {PHASE_LABELS[derived.phase]}
      </text>
      <text className={styles.valueLabel} x={22} y={272}>
        {derived.lvPressureMmHg.toFixed(0)} mmHg · {derived.lvVolumeML.toFixed(0)} mL
      </text>
      <text className={styles.valueLabel} x={22} y={288}>
        {derived.heartRateBpm.toFixed(0)} bpm · CO {derived.cardiacOutputLPerMin.toFixed(1)} L/min
      </text>
    </DiagramFrame>
  );
}
