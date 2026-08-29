import { phFactor, rateAt, temperatureFactor } from '../engine/kinetics';
import type { KineticsDerived, KineticsInputs } from '../engine/types';
import styles from './Diagram.module.css';

interface ReactionCurveChartProps {
  inputs: KineticsInputs;
  derived: KineticsDerived;
}

const WIDTH = 460;
const HEIGHT = 240;
const PAD = { left: 46, right: 14, top: 16, bottom: 34 };
const MAX_S = 8; // mmol/L shown on the curve
const MAX_V_FRACTION = 1.15; // y axis as a fraction of uninhibited Vmax

/**
 * The velocity–substrate curve, computed live from the same functions the engine runs.
 * The marker is the current operating point; the dashed lines mark apparent Km and Vmax so
 * the effect of each inhibitor class can be READ off the geometry rather than memorised.
 */
export function ReactionCurveChart({ inputs, derived }: ReactionCurveChartProps) {
  const km = derived.apparentKmMm;
  const vmax = rateAt(1000, derived.apparentVmaxUmPerMin, km); // asymptote estimate
  const baselineVmax = inputs.vmaxUmPerMin;

  const x = (s: number) => PAD.left + (Math.log10((Math.max(s, 0.005) + 0.05) / 0.05) / Math.log10(MAX_S / 0.05)) * (WIDTH - PAD.left - PAD.right);
  const y = (v: number) => HEIGHT - PAD.bottom - (v / (baselineVmax * MAX_V_FRACTION)) * (HEIGHT - PAD.top - PAD.bottom);

  const points: string[] = [];
  for (let i = 0; i <= 160; i += 1) {
    const s = Math.pow(10, Math.log10(0.05) + (i / 160) * Math.log10(MAX_S / 0.05)) - 0.05;
    points.push(`${x(Math.max(s, 0))},${y(rateAt(Math.max(s, 0), derived.apparentVmaxUmPerMin, km))}`);
  }

  // The uninhibited reference curve, for comparison.
  const refPoints: string[] = [];
  for (let i = 0; i <= 80; i += 1) {
    const s = Math.pow(10, Math.log10(0.05) + (i / 80) * Math.log10(MAX_S / 0.05)) - 0.05;
    refPoints.push(`${x(Math.max(s, 0))},${y(rateAt(Math.max(s, 0), inputs.vmaxUmPerMin * temperatureFactor(inputs.temperatureC) * phFactor(inputs.ph), inputs.kmMm))}`);
  }

  const halfV = rateAt(1000, derived.apparentVmaxUmPerMin, km) / 2;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.chart} role="img" aria-label="Velocity against substrate concentration">
      {/* axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={HEIGHT - PAD.bottom} className={styles.axis} />
      <line x1={PAD.left} y1={HEIGHT - PAD.bottom} x2={WIDTH - PAD.right} y2={HEIGHT - PAD.bottom} className={styles.axis} />
      <text x={WIDTH / 2} y={HEIGHT - 6} textAnchor="middle" className={styles.axisLabel}>
        substrate [S] (log scale, mmol/L)
      </text>
      <text x={12} y={PAD.top + 40} className={styles.axisLabel} transform={`rotate(-90 12 ${PAD.top + 40})`} textAnchor="middle">
        v (µmol/min)
      </text>

      {/* Vmax asymptote and Km marker */}
      <line x1={PAD.left} y1={y(vmax)} x2={WIDTH - PAD.right} y2={y(vmax)} className={styles.asymptote} />
      <text x={WIDTH - PAD.right - 4} y={y(vmax) - 5} textAnchor="end" className={styles.markerLabel}>
        Vmax′ ≈ {vmax.toFixed(0)}
      </text>
      <line x1={x(km)} y1={y(halfV)} x2={x(km)} y2={HEIGHT - PAD.bottom} className={styles.guide} />
      <circle cx={x(km)} cy={y(halfV)} r={3} className={styles.guideDot} />
      <text x={x(km) + 5} y={HEIGHT - PAD.bottom - 6} className={styles.markerLabel}>
        Km′ = {km < 0.1 ? km.toFixed(3) : km.toFixed(2)}
      </text>

      {/* curves */}
      <polyline points={refPoints.join(' ')} className={styles.referenceCurve} />
      <polyline points={points.join(' ')} className={styles.activeCurve} />

      {/* current operating point */}
      <line x1={x(derived.substrateMm)} y1={y(derived.reactionRateUmPerMin)} x2={x(derived.substrateMm)} y2={HEIGHT - PAD.bottom} className={styles.operatingGuide} />
      <circle cx={x(derived.substrateMm)} cy={y(derived.reactionRateUmPerMin)} r={4.5} className={styles.operatingPoint} />
    </svg>
  );
}

/** Apparent-constant summary strip under the curve. */
export function KineticsConstants({ inputs, derived }: { inputs: KineticsInputs; derived: KineticsDerived }) {
  void inputs;
  return (
    <div className={styles.constantsRow}>
      <span>
        Km′ <strong>{derived.apparentKmMm < 0.1 ? derived.apparentKmMm.toFixed(3) : derived.apparentKmMm.toFixed(2)}</strong> mmol/L
      </span>
      <span>
        Vmax′ <strong>{derived.apparentVmaxUmPerMin.toFixed(0)}</strong> µmol/min
      </span>
      <span>
        saturation <strong>{derived.saturationPct.toFixed(0)}%</strong>
      </span>
      <span>
        residual activity <strong>{derived.residualActivityPct.toFixed(0)}%</strong>
      </span>
    </div>
  );
}
