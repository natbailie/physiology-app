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

const LV = { cx: 300, cy: 180 };
const MITRAL = { cx: 276, cy: 116 };
const AORTIC = { cx: 348, cy: 138 };

/**
 * A valve as two leaflets hinged on the annulus.
 *
 * Shut, the tips meet in the middle and block the orifice. Open, they swing back against the
 * walls and the orifice is clear. Drawing it this way rather than as a line that changes colour
 * means the picture says which way blood can move, which is the whole of what a valve is.
 */
function Valve({ cx, cy, open, half = 15 }: { cx: number; cy: number; open: boolean; half?: number }) {
  const tipX = open ? half - 2 : 0;
  const tipY = open ? 15 : 17;
  return (
    <g className={open ? styles.valveOpen : styles.valveShut} transform={`translate(${cx}, ${cy})`}>
      <path d={`M ${-half} 0 L ${-tipX} ${tipY}`} />
      <path d={`M ${half} 0 L ${tipX} ${tipY}`} />
    </g>
  );
}

/**
 * One beat of the left heart, drawn as the chambers and valves it happens in.
 *
 * The ventricle's radius is its volume and its fill is its pressure, so the cycle is a chamber
 * that swells and empties rather than a circle beside some numbers. The valves now sit where
 * valves sit — the mitral between the atrium and the ventricle, the aortic between the
 * ventricle and the aorta — so "isovolumic" is visibly the phase when both are shut and the
 * volume cannot change however hard the muscle squeezes.
 *
 * The two pressures that decide the valves are on the drawing beside them, because the aortic
 * valve opening is not a rule of the animation: it is the moment ventricular pressure passes
 * aortic pressure.
 */
export function CardiacDiagram({ derived }: CardiacDiagramProps) {
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
      ariaLabel="The cardiac cycle: the SA and AV nodes firing in sequence, the left ventricle filling and ejecting, and the mitral and aortic valves opening and shutting through the four phases"
    >
      {/* ---- Conduction, ending ON the ventricle it activates ---- */}
      <text className={styles.pathLabel} x={20} y={26}>
        Conduction
      </text>
      <path className={styles.conductionPath} d="M 100 62 C 132 78 152 90 166 106" />
      <path className={styles.conductionPath} d="M 174 122 C 196 146 224 166 250 176" />

      <g transform="translate(96, 56)" style={{ '--node-activation': saActivation } as CSSProperties}>
        <circle className={styles.node} r={11} />
        <text className={styles.organLabel} y={-18}>
          SA node
        </text>
      </g>

      <g transform="translate(170, 114)" style={{ '--node-activation': avActivation } as CSSProperties}>
        <circle className={styles.node} r={9} />
        <text className={styles.organLabel} x={-32} y={4}>
          AV
        </text>
      </g>

      <text className={styles.pathLabel} x={120} y={146}>
        PR {derived.avConductionDelay} ms
      </text>
      {derived.isHeartBlock && (
        <text className={styles.pathLabel} x={120} y={162} fill="var(--danger)">
          Complete block
        </text>
      )}

      {/* ---- The aorta the ventricle ejects into ---- */}
      <path className={styles.aorta} d="M 348 134 L 348 74 Q 348 52 372 52 L 438 52" />
      <text className={styles.organLabel} x={410} y={42}>
        Aorta
      </text>

      {/* ---- The atrium the ventricle fills from ---- */}
      <rect className={styles.atrium} x={232} y={54} width={80} height={42} rx={12} />
      <text className={styles.organLabel} x={272} y={80}>
        Left atrium
      </text>
      <path className={styles.inflow} d="M 276 96 L 276 114" />

      {/* Inflow and outflow tracts. They start inside the chamber, so the valves stay attached
          to it however far the ventricle empties. */}
      <path className={styles.tract} d="M 276 130 L 286 158" />
      <path className={styles.tract} d="M 322 162 L 344 142" />

      {/* ---- Left ventricle: radius is volume, fill is pressure ---- */}
      <g transform={`translate(${LV.cx}, ${LV.cy})`} style={chamberStyle}>
        <circle className={styles.ventricleChamber} r={chamberRadius} />
        <circle className={styles.ventricleWall} r={chamberRadius} />
      </g>
      <text className={styles.organLabel} x={LV.cx} y={LV.cy + 74}>
        Left ventricle
      </text>

      {/* ---- The two valves, and the two pressures that decide them ---- */}
      <Valve cx={MITRAL.cx} cy={MITRAL.cy} open={mitralOpen} />
      <text className={styles.anatomy} x={MITRAL.cx - 22} y={MITRAL.cy - 6} textAnchor="end">
        Mitral valve
      </text>
      <Valve cx={AORTIC.cx} cy={AORTIC.cy} open={aorticOpen} />
      <text className={styles.anatomy} x={AORTIC.cx + 22} y={AORTIC.cy - 6}>
        Aortic valve
      </text>

      <text className={styles.valueLabel} x={AORTIC.cx + 22} y={AORTIC.cy + 10}>
        aorta {derived.afterloadPressure.toFixed(0)}
      </text>
      <text className={styles.valueLabel} x={LV.cx} y={LV.cy + 4} textAnchor="middle">
        {derived.lvPressureMmHg.toFixed(0)} mmHg
      </text>
      <text className={styles.valueLabel} x={LV.cx} y={LV.cy + 18} textAnchor="middle">
        {derived.lvVolumeML.toFixed(0)} mL
      </text>

      {/* ---- Where in the beat we are ---- */}
      <text className={styles.phaseBadge} x={20} y={244}>
        {PHASE_LABELS[derived.phase]}
      </text>
      <text className={styles.valueLabel} x={20} y={266}>
        {derived.heartRateBpm.toFixed(0)} bpm · CO {derived.cardiacOutputLPerMin.toFixed(1)} L/min
      </text>
      <text className={styles.valueLabel} x={20} y={282}>
        SV {derived.strokeVolumeML.toFixed(0)} mL · EF {derived.ejectionFractionPercent.toFixed(0)}%
      </text>
    </DiagramFrame>
  );
}
