import type { CSSProperties } from 'react';
import { AUDIOGRAM_FREQS_HZ } from '../engine/constants';
import { clamp } from '@/shared/lib/math';
import type { HearingDerived } from '../engine/types';
import styles from './Audiogram.module.css';

interface AudiogramProps {
  derived: HearingDerived;
}

const W = 220;
const H = 84;
const MAX_DB = 90;
const PAD_L = 4;

const fx = (i: number) => PAD_L + (i / (AUDIOGRAM_FREQS_HZ.length - 1)) * (W - PAD_L * 2);
const fy = (db: number) => (clamp(db, 0, MAX_DB) / MAX_DB) * H;

/**
 * The audiogram, in the charts where an audiogram belongs.
 *
 * It used to occupy most of the diagram frame, which left the module with no ear in it at all —
 * and an audiogram is a chart by any definition. The diagram now draws the apparatus and this
 * plots what it can hear, which is the same split every other module already uses.
 *
 * Air above bone is a gap, and the gap is the conductive component. Drawing both lines on one
 * axis is the whole point; separating them would lose it.
 */
export function Audiogram({ derived }: AudiogramProps) {
  const line = (values: number[]) =>
    values.map((db, i) => `${i === 0 ? 'M' : 'L'}${fx(i).toFixed(1)},${fy(db).toFixed(1)}`).join(' ');

  return (
    <div className={styles.wrap} style={{ '--chart-color': 'var(--cochlea)' } as CSSProperties}>
      <div className={styles.header}>
        <span className="label">Audiogram · air vs bone</span>
        <span className={styles.current}>
          gap {derived.airBoneGapDb.toFixed(0)} dB
        </span>
      </div>
      <svg className={styles.svg} viewBox={`0 0 ${W} ${H + 12}`} preserveAspectRatio="none" aria-hidden="true">
        {[20, 40, 60, 80].map((db) => (
          <line key={db} className={styles.gridline} x1={0} x2={W} y1={fy(db)} y2={fy(db)} />
        ))}
        <path className={styles.bone} d={line(derived.boneConductionDb)} />
        <path className={styles.air} d={line(derived.airConductionDb)} />
        {derived.airConductionDb.map((db, i) => (
          <circle key={AUDIOGRAM_FREQS_HZ[i]} className={styles.airMark} cx={fx(i)} cy={fy(db)} r={2.4} />
        ))}
      </svg>
    </div>
  );
}
