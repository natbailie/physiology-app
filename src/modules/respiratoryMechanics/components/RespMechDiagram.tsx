import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp, scaleClamped } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { RespMechDerived } from '../engine/types';

interface RespMechDiagramProps {
  derived: RespMechDerived;
}

const LUNG_PATH =
  'M0,-38 C18,-40 30,-14 28,14 C26,38 14,50 0,50 C-2,50 -4,49 -6,48 C-16,42 -24,26 -24,4 C-24,-20 -14,-38 0,-38 Z';

/** One V/Q compartment: a alveolar unit with its ventilation and perfusion arrows, tinted by
 * how far its V/Q ratio has departed from the ideal of 1. */
function VqUnit({
  x,
  y,
  label,
  ventilation,
  perfusion,
  vqRatio,
}: {
  x: number;
  y: number;
  label: string;
  ventilation: number;
  perfusion: number;
  vqRatio: number;
}) {
  // Deviation from a V/Q of 1 in either direction, on a log-ish scale so both shunt (→0) and
  // dead space (→infinity) read as abnormal.
  const deviation = clamp(Math.abs(Math.log10(Math.max(vqRatio, 0.01))) / 1.2, 0, 1);
  const style = {
    '--vq-deviation': deviation,
    '--ventilation': clamp(ventilation, 0.08, 1),
    '--perfusion': clamp(perfusion, 0.08, 1),
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      <path className={styles.ventilationArrow} d="M-34,-16 L-12,-6" markerEnd="url(#vent-arrow)" />
      <circle className={styles.vqUnit} r={17} />
      <path className={styles.perfusionArrow} d="M12,8 L34,18" markerEnd="url(#perf-arrow)" />
      <text className={styles.organLabel} y={34}>
        {label}
      </text>
      <text className={styles.valueLabel} y={46}>
        V/Q {vqRatio >= 10 ? '≫1' : vqRatio.toFixed(2)}
      </text>
    </g>
  );
}

export function RespMechDiagram({ derived }: RespMechDiagramProps) {
  const inflation = scaleClamped(derived.lungVolumeML, derived.residualVolumeML, derived.totalLungCapacityML, 0, 1);
  const lungStyle = { '--inflation': inflation } as CSSProperties;
  const alveolusStyle = { '--surfactant': clamp(derived.surfactantFunction, 0, 1) } as CSSProperties;

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Diagram of lung mechanics: lungs inflating and deflating with tidal volume, an alveolar inset showing surfactant function, and two ventilation-perfusion compartments"
      defs={
        <>
          <marker id="vent-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--compliance)" />
          </marker>
          <marker id="perf-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--artery)" />
          </marker>
        </>
      }
    >
      <g transform="translate(96, 96)" style={lungStyle}>
        <path className={styles.trachea} d="M0,-56 L0,-30" />
        <path className={styles.lungShape} d={LUNG_PATH} transform="translate(-20, 0)" />
        <path className={styles.lungShape} d={LUNG_PATH} transform="translate(20, 0) scale(-1, 1)" />
        <text className={styles.organLabel} y={70}>
          Lungs
        </text>
      </g>

      <g transform="translate(212, 74)" style={alveolusStyle}>
        <circle className={styles.alveolus} r={19} />
        <text className={styles.pathLabel} x={-26} y={-26}>
          Surfactant {(derived.surfactantFunction * 100).toFixed(0)}%
        </text>
      </g>

      <text className={styles.pathLabel} x={318} y={40}>
        V/Q compartments
      </text>
      <VqUnit x={340} y={84} label="Unit A" ventilation={derived.ventilationUnitA} perfusion={derived.perfusionUnitA} vqRatio={derived.vqRatioA} />
      <VqUnit x={340} y={186} label="Unit B" ventilation={derived.ventilationUnitB} perfusion={derived.perfusionUnitB} vqRatio={derived.vqRatioB} />

      {derived.hpvDiversionLevel > 0.02 && (
        <text className={styles.pathLabel} x={252} y={252} fill="var(--vq)">
          HPV diverting {(derived.hpvDiversionLevel * 100).toFixed(0)}%
        </text>
      )}

      <text className={styles.patternBadge} x={22} y={210}>
        {derived.spirometryPattern}
      </text>
      <text className={styles.pathLabel} x={22} y={230}>
        FEV1/FVC {derived.fev1RatioPercent.toFixed(0)}%
      </text>
      <text className={styles.pathLabel} x={22} y={246}>
        FVC {(derived.fvcML / 1000).toFixed(2)} L · TLC {(derived.totalLungCapacityML / 1000).toFixed(2)} L
      </text>
      <text className={styles.pathLabel} x={22} y={262}>
        RV {(derived.residualVolumeML / 1000).toFixed(2)} L · tau {derived.timeConstantSeconds.toFixed(2)} s
      </text>
      <text className={styles.pathLabel} x={22} y={278}>
        {derived.fvcManeuverActive ? 'FVC maneuver running' : `volume ${(derived.lungVolumeML / 1000).toFixed(2)} L`}
      </text>
    </DiagramFrame>
  );
}
