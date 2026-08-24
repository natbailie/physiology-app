import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import { CLASSIFICATION } from '../engine/constants';
import type { FetalDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface FetalDiagramProps {
  derived: FetalDerived;
}

/** Saturation probes are coloured by whether they would look pink or blue at the cot side. */
function probeClass(saturation: number): string | undefined {
  return saturation >= 88 ? styles.probeHigh : styles.probeLow;
}

export function FetalDiagram({ derived }: FetalDiagramProps) {
  const ductalMagnitude = clamp(Math.abs(derived.ductalShuntFraction), 0, 1);
  const rightToLeft = derived.ductalShuntFraction > 0;

  const style = {
    '--placental': clamp(derived.placentalCirculation, 0.05, 1),
    '--inflation': clamp(derived.lungInflation, 0, 1),
  } as CSSProperties;

  const ductStyle = {
    '--shunt-flow': ductalMagnitude,
    '--shunt-open': clamp(derived.ductusArteriosusPatency, 0, 1),
  } as CSSProperties;

  const foramenStyle = {
    '--shunt-flow': clamp(derived.atrialShuntFraction * 2, 0, 1),
    '--shunt-open': clamp(derived.foramenOvalePatency, 0, 1),
  } as CSSProperties;

  const ductClass =
    derived.ductusArteriosusPatency < 0.12
      ? styles.closed
      : rightToLeft
        ? styles.shuntRightToLeft
        : styles.shuntLeftToRight;

  const foramenClass = derived.foramenOvalePatency < 0.12 ? styles.closed : styles.shuntRightToLeft;

  return (
    <DiagramFrame viewBox="0 0 560 400" ariaLabel="Fetal circulation with its three shunts">
      <g style={style}>
        {/* Right heart and pulmonary artery */}
        <rect className={styles.rightSide} x={150} y={190} width={62} height={62} rx={8} />
        <text className={styles.label} x={148} y={182}>
          RIGHT
        </text>

        {/* Left heart and aorta */}
        <rect className={styles.leftSide} x={330} y={190} width={62} height={62} rx={8} />
        <text className={styles.label} x={332} y={182}>
          LEFT
        </text>

        {/* Lungs — faint while fluid-filled, brightening as they aerate. */}
        <path className={styles.lung} d="M 232 120 q 25 -34 45 0 q 25 34 45 0" />
        <text className={styles.label} x={244} y={100}>
          LUNGS
        </text>

        {/* Placenta — fades out as the cord is clamped. */}
        <circle className={styles.placenta} cx={80} cy={330} r={26} />
        <text className={styles.label} x={48} y={298}>
          PLACENTA
        </text>

        {/* Ductus arteriosus: the bypass. Colour shows direction, width shows flow. */}
        <path className={ductClass} style={ductStyle} d="M 212 205 L 330 205" />
        <text className={styles.label} x={238} y={198}>
          DUCTUS
        </text>

        {/* Foramen ovale: atrial-level streaming. */}
        <path className={foramenClass} style={foramenStyle} d="M 212 240 L 330 240" />
        <text className={styles.label} x={236} y={262}>
          FORAMEN
        </text>

        <path className={styles.venous} d="M 106 330 L 150 330 L 150 252" />
        <path className={styles.systemic} d="M 392 221 L 460 221 L 460 330 L 106 330" opacity={0.5} />

        {/* Saturation probes — the two numbers that make the diagnosis. */}
        <text className={probeClass(derived.preDuctalSaturationPercent)} x={370} y={112}>
          {derived.preDuctalSaturationPercent.toFixed(0)}%
        </text>
        <text className={styles.label} x={370} y={128}>
          RIGHT ARM (PRE)
        </text>

        <text className={probeClass(derived.postDuctalSaturationPercent)} x={370} y={306}>
          {derived.postDuctalSaturationPercent.toFixed(0)}%
        </text>
        <text className={styles.label} x={370} y={322}>
          FOOT (POST)
        </text>

        <text className={styles.caption} x={36} y={40}>
          PVR {derived.pulmonaryVascularResistance.toFixed(1)} · SVR{' '}
          {derived.systemicVascularResistance.toFixed(2)} · lungs receive{' '}
          {(derived.pulmonaryFlowFraction * 100).toFixed(0)}% of output
        </text>
        {derived.saturationGradientPercent > CLASSIFICATION.DIFFERENTIAL_GAP_PERCENT && (
          <text className={styles.probeLow} x={36} y={60}>
            differential cyanosis — {derived.saturationGradientPercent.toFixed(0)}% gap
          </text>
        )}

        <text className={styles.verdict} x={36} y={378}>
          {derived.phase}
        </text>
      </g>
    </DiagramFrame>
  );
}
