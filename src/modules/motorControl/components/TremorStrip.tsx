import type { CSSProperties } from 'react';
import type { MotorDerived } from '../engine/types';
import styles from './TremorStrip.module.css';

interface TremorStripProps {
  derived: MotorDerived;
}

const WIDTH = 220;
const HEIGHT = 46;
const SAMPLES = 160;

/**
 * The superposed tremor waveform.
 *
 * It lives in the charts rather than in the diagram, where it used to sit: it is a trace, not a
 * mechanism. It earns its place beside the resting-tremor sparkline because the two say
 * different things — the sparkline is how big the tremor is over time, this is what KIND it is.
 * A 5 Hz rest tremor, a 10 Hz postural one and an intention tremor that grows as the hand
 * arrives all read as different shapes at the same amplitude.
 */
export function TremorStrip({ derived }: TremorStripProps) {
  const points: string[] = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const t = i / SAMPLES;
    const envelope =
      derived.restingTremorAmp * Math.sin(t * Math.PI * 8) +
      derived.intentionTremorAmp * Math.sin(t * Math.PI * 5) * Math.sin(t * Math.PI) +
      derived.posturalTremorAmp * 0.6 * Math.sin(t * Math.PI * 12);
    const y = HEIGHT / 2 - envelope * 1.7;
    points.push(`${i === 0 ? 'M' : 'L'}${(t * WIDTH).toFixed(1)},${y.toFixed(1)}`);
  }

  const dominant =
    Math.max(derived.restingTremorAmp, derived.intentionTremorAmp, derived.posturalTremorAmp) < 0.5
      ? 'none'
      : derived.restingTremorAmp >= Math.max(derived.intentionTremorAmp, derived.posturalTremorAmp)
        ? 'rest'
        : derived.intentionTremorAmp >= derived.posturalTremorAmp
          ? 'intention'
          : 'postural';

  return (
    <div className={styles.wrap} style={{ '--chart-color': 'var(--nociception)' } as CSSProperties}>
      <div className={styles.header}>
        <span className="label">Tremor waveform</span>
        <span className={styles.current}>{dominant}</span>
      </div>
      <svg className={styles.svg} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
        <line className={styles.baseline} x1={0} y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} />
        <path className={styles.wave} d={points.join(' ')} />
      </svg>
    </div>
  );
}
