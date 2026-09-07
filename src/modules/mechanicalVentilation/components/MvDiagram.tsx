import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import { airwayPressureAtPhase } from '../engine/pressures';
import type { MvDerived, MvInputs } from '../engine/types';
import styles from './Diagram.module.css';

interface MvDiagramProps {
  derived: MvDerived;
  inputs: MvInputs;
}

/** The waveform window the monitor draws: a fixed stretch of real time, so a faster rate packs
 * more breaths into it — the one place a rate change is actually drawn, not merely counted. */
const WINDOW_SECONDS = 8;
const WAVE = { left: 18, right: 282, top: 30, bottom: 122 };
const PRESSURE_MIN = 0;
const PRESSURE_MAX = 35;

function pressureY(p: number): number {
  return WAVE.bottom - ((clamp(p, PRESSURE_MIN, PRESSURE_MAX) - PRESSURE_MIN) / (PRESSURE_MAX - PRESSURE_MIN)) * (WAVE.bottom - WAVE.top);
}

function waveformPoints(derived: MvDerived, samples = 72): string {
  const cycleSeconds = 60 / Math.max(derived.effectiveRatePerMin, 1);
  const peak = Math.max(derived.totalPeepCmH2O, derived.peakPressureCmH2O);
  const d: string[] = [];
  for (let k = 0; k <= samples; k++) {
    const t = (k / samples) * WINDOW_SECONDS;
    const phase = (t / cycleSeconds) % 1;
    const p = airwayPressureAtPhase(phase, derived.totalPeepCmH2O, peak);
    const x = WAVE.left + (k / samples) * (WAVE.right - WAVE.left);
    const y = pressureY(p);
    d.push(`${k === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return d.join(' ');
}

const MODE_LABEL: Record<MvInputs['mode'], string> = {
  cpap: 'CPAP',
  niv: 'BiPAP (NIV)',
  invasive: 'Invasive',
};

/** One alveolar unit: tinted by how far it is from being open (recruited) or shunted; the two
 * labels make the learner read the shunt that PEEP is fighting off the picture itself. */
function LungUnit({
  x,
  label,
  metric,
  recruitment,
}: {
  x: number;
  label: string;
  metric: string;
  recruitment: number;
}) {
  const deviation = clamp((1 - recruitment) * 1.6, 0, 1);
  const style = { '--vq-deviation': deviation } as CSSProperties;
  return (
    <g transform={`translate(${x}, 132)`} style={style}>
      <circle className={styles.unitCircle} r={20} />
      <text className={styles.organLabel} y={6} textAnchor="middle">
        {label}
      </text>
      <text className={styles.valueLabel} y={36}>
        {metric}
      </text>
    </g>
  );
}

export function MvDiagram({ derived, inputs }: MvDiagramProps) {
  const fiO2Pct = Math.round(inputs.fiO2 * 100);
  const isCpap = derived.mode === 'cpap';
  const autoPeepVisible = derived.intrinsicPeepCmH2O > 0.5;
  const o2Style = { '--o2-strength': clamp(inputs.fiO2, 0.2, 1) } as CSSProperties;

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel={`Ventilator pressures and gas exchange: airway pressure waveform, recruited and shunted lung units, mode ${MODE_LABEL[derived.mode]}`}
      defs={
        <marker id="mv-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--vq)" />
        </marker>
      }
    >
      {/* Airway-pressure monitor, left two thirds. */}
      <text className={styles.pathLabel} x={18} y={18}>
        Airway pressure (cmH2O)
      </text>
      <line className={styles.axis} x1={WAVE.left} y1={WAVE.bottom} x2={WAVE.right} y2={WAVE.bottom} />
      <line className={styles.axis} x1={WAVE.left} y1={WAVE.top} x2={WAVE.right} y2={WAVE.top} />
      <line className={styles.axis} x1={WAVE.left} y1={WAVE.top} x2={WAVE.left} y2={WAVE.bottom} />
      <text className={styles.tickLabel} x={WAVE.left - 4} y={WAVE.bottom + 14} textAnchor="end">
        0
      </text>
      <text className={styles.tickLabel} x={WAVE.left - 4} y={WAVE.top + 3} textAnchor="end">
        35
      </text>
      {/* Set PEEP at the monitor floor; the auto-PEEP stack sits above it when the lung traps. */}
      <line className={styles.peepLine} x1={WAVE.left} y1={pressureY(derived.totalPeepCmH2O)} x2={WAVE.right} y2={pressureY(derived.totalPeepCmH2O)} />
      {autoPeepVisible && (
        <text className={styles.peepLabel} x={WAVE.left + 40} y={pressureY(derived.totalPeepCmH2O) - 5}>
          auto-PEEP {derived.intrinsicPeepCmH2O.toFixed(1)}
        </text>
      )}
      <path className={styles.waveTrail} d={waveformPoints(derived)} />
      <circle className={styles.waveDot} cx={WAVE.right} cy={pressureY(derived.airwayPressureCmH2O)} r={3.5} />

      {/* The ventilator unit: mode, set pressures, and what that buys. */}
      <g transform="translate(20, 156)">
        <rect className={styles.ventBox} width={140} height={92} />
        <text className={styles.organLabel} x={70} y={20} textAnchor="middle">
          {MODE_LABEL[derived.mode]}
        </text>
        <text className={styles.valueLabel} x={10} y={38} textAnchor="start">
          PEEP {derived.totalPeepCmH2O.toFixed(1)}
        </text>
        <text className={styles.valueLabel} x={10} y={52} textAnchor="start">
          {isCpap ? 'EPAP' : 'IPAP/PIP'} {derived.inspiratoryPressureCmH2O.toFixed(1)}
        </text>
        <text className={styles.valueLabel} x={10} y={66} textAnchor="start">
          rate {derived.effectiveRatePerMin.toFixed(1)}/min
        </text>
        <text className={styles.valueLabel} x={10} y={80} textAnchor="start">
          VT {derived.tidalVolumeML} mL
        </text>
      </g>

      {/* Patient effort meter — pressure support lifts the load off these muscles. */}
      <g transform="translate(180, 156)">
        <rect className={styles.effortBg} width={18} height={92} />
        <rect className={styles.effortFill} y={92 - derived.wobEffortPct * 0.92} width={18} height={derived.wobEffortPct * 0.92} />
        <text className={styles.tickLabel} x={9} y={108} textAnchor="middle">
          effort
        </text>
      </g>

      {/* Lung units and the inspired-gas route. */}
      <text className={styles.pathLabel} x={218} y={176}>
        lung units
      </text>
      <path className={styles.flowArrow} d="M236,140 C266,126 288,132 302,136" markerEnd="url(#mv-arrow)" />
      <path className={styles.flowArrow} d="M440,140 L404,136" markerEnd="url(#mv-arrow)" />
      <LungUnit x={302} label="recruited" metric={`open ${Math.round((1 - derived.effectiveShuntFraction) * 100)}%`} recruitment={derived.recruitmentLevel} />
      <LungUnit x={404} label="shunt" metric={`shunt ${Math.round(derived.effectiveShuntFraction * 100)}%`} recruitment={derived.recruitmentLevel} />
      <g transform="translate(354, 44)" style={o2Style}>
        <rect className={styles.o2Pill} x={-46} y={-11} width={92} height={22} />
        <text className={styles.valueLabel} y={3}>
          inspired O₂ {fiO2Pct}%
        </text>
      </g>

      {/* Classification summary — withheld during practice by DiagramFrame's blinder. */}
      <text className={styles.verdict} x={18} y={276} fill="var(--co2)">
        failure: {derived.failureType}
      </text>
      <text className={styles.pathLabel} x={142} y={276} fill="var(--vq)">
        VILI risk {derived.viliRisk}
      </text>
      <text className={styles.caption} x={276} y={276}>
        key: vq V/Q · compliance effort · co2 CO2
      </text>
    </DiagramFrame>
  );
}