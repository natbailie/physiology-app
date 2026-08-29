import type { CSSProperties } from 'react';
import { clamp } from '@/shared/lib/math';
import type { NmjDerived } from '../engine/types';
import styles from './TrainOfFour.module.css';

interface TrainOfFourProps {
  derived: NmjDerived;
}

const W = 220;
const H = 56;

/**
 * The train-of-four, in the charts.
 *
 * Four twitches and a ratio is a chart, and it used to take up a third of the diagram frame —
 * which is a third the synapse itself did not get. Fade is a comparison between bars, so they
 * belong together on one axis and nowhere near the anatomy.
 */
export function TrainOfFour({ derived }: TrainOfFourProps) {
  const bars = derived.trainOfFour;
  const slot = W / (bars.length || 1);
  const fade = derived.trainOfFourRatio;

  return (
    <div className={styles.wrap} style={{ '--chart-color': 'var(--sarcomere)' } as CSSProperties}>
      <div className={styles.header}>
        <span className="label">Train of four</span>
        <span className={styles.current}>
          T4/T1 {fade.toFixed(2)}
          {fade < 0.9 ? ' · fade' : ''}
        </span>
      </div>
      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <line className={styles.baseline} x1={0} y1={H} x2={W} y2={H} />
        {bars.map((amp, i) => {
          const h = clamp(amp, 0, 1.2) * (H - 4);
          return (
            <rect
              key={i}
              className={styles.twitch}
              x={i * slot + slot * 0.22}
              y={H - h}
              width={slot * 0.56}
              height={Math.max(h, 0.5)}
              rx={2}
            />
          );
        })}
      </svg>
    </div>
  );
}
