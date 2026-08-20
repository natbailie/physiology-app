import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import { SMALL_INTESTINE_PATH } from '@/shared/diagram/organShapes';
import { clamp, scaleClamped } from '@/shared/lib/math';
import { BRONCHI, GI, HEART, PUPIL, SECRETION } from '../engine/constants';
import type { AnsDerived } from '../engine/types';

interface OrganEffectorsProps {
  derived: AnsDerived;
}

const HEART_PATH = 'M0,-12 C-8,-22 -24,-18 -24,-4 C-24,10 -8,20 0,26 C8,20 24,10 24,-4 C24,-18 8,-22 0,-12 Z';
const LUNG_PATH = 'M0,-20 C10,-21 16,-7 15,7 C14,20 7,26 0,26 C-7,26 -14,20 -15,7 C-16,-7 -10,-21 0,-20 Z';
const GLAND_PATH = 'M-11,-8 C-11,-16 -1,-19 7,-14 C15,-9 14,2 6,8 C-2,14 -12,9 -11,-1 Z';

/** One organ tile: shape tinted toward whichever branch currently dominates it, with its
 * live value printed underneath. */
function Organ({
  x,
  y,
  label,
  value,
  /** -1 (fully parasympathetic-driven) .. +1 (fully sympathetic-driven) */
  drivenBy,
  intensity,
  children,
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  drivenBy: number;
  intensity: number;
  children: React.ReactNode;
}) {
  const style = {
    '--organ-drive': clamp(intensity, 0, 1),
    '--organ-tint': drivenBy >= 0 ? 'var(--sympathetic)' : 'var(--parasympathetic)',
  } as CSSProperties;

  return (
    <g transform={`translate(${x}, ${y})`} style={style}>
      {children}
      <text className={styles.organLabel} y={42}>
        {label}
      </text>
      <text className={styles.valueLabel} y={55}>
        {value}
      </text>
    </g>
  );
}

export function OrganEffectors({ derived }: OrganEffectorsProps) {
  const heartStyle = { '--hr-bpm': derived.heartRateBpm } as CSSProperties;
  // Each organ's tint reflects which branch is currently winning at THAT organ — which is how
  // the heart and the gut end up tinted oppositely under the same autonomic state.
  const heartDrive = scaleClamped(derived.heartRateBpm, 50, HEART.MAX_BPM, 0, 1);
  const giDrive = scaleClamped(derived.giMotilityIndex, GI.MIN_INDEX, GI.MAX_INDEX, 0, 1);
  const bronchialDrive = scaleClamped(derived.bronchialDiameterPercent, BRONCHI.MIN_PERCENT, BRONCHI.MAX_PERCENT, 0, 1);
  const secretionDrive = scaleClamped(derived.secretionIndex, SECRETION.MIN_INDEX, SECRETION.MAX_INDEX, 0, 1);
  const pupilRadius = scaleClamped(derived.pupilDiameterMm, PUPIL.MIN_MM, PUPIL.MAX_MM, 3, 13);

  return (
    <>
      <Organ
        x={92}
        y={92}
        label="Heart"
        value={`${derived.heartRateBpm.toFixed(0)} bpm`}
        drivenBy={derived.heartRateBpm >= 70 ? 1 : -1}
        intensity={heartDrive}
      >
        <g style={heartStyle}>
          <path className={styles.heartShape} d={HEART_PATH} />
        </g>
      </Organ>

      <Organ
        x={224}
        y={92}
        label="Bronchi"
        value={`${derived.bronchialDiameterPercent.toFixed(0)}%`}
        drivenBy={derived.bronchialDiameterPercent >= BRONCHI.BASELINE_PERCENT ? 1 : -1}
        intensity={bronchialDrive}
      >
        <path className={styles.organShape} d={LUNG_PATH} transform="translate(-13, 0)" />
        <path className={styles.organShape} d={LUNG_PATH} transform="translate(13, 0) scale(-1, 1)" />
      </Organ>

      <Organ
        x={356}
        y={92}
        label="Pupil"
        value={`${derived.pupilDiameterMm.toFixed(1)} mm`}
        drivenBy={derived.pupilDiameterMm >= PUPIL.BASELINE_MM ? 1 : -1}
        intensity={scaleClamped(derived.pupilDiameterMm, PUPIL.MIN_MM, PUPIL.MAX_MM, 0, 1)}
      >
        <circle className={styles.iris} cx={0} cy={4} r={17} />
        <circle className={styles.pupil} cx={0} cy={4} r={pupilRadius} />
      </Organ>

      <Organ
        x={140}
        y={212}
        label="Gut motility"
        value={derived.giMotilityIndex.toFixed(0)}
        drivenBy={derived.giMotilityIndex >= GI.BASELINE_INDEX ? -1 : 1}
        intensity={giDrive}
      >
        <path className={styles.organShape} d={SMALL_INTESTINE_PATH} transform="scale(0.72)" />
      </Organ>

      <Organ
        x={308}
        y={212}
        label="Secretions"
        value={derived.secretionIndex.toFixed(0)}
        drivenBy={derived.secretionIndex >= SECRETION.BASELINE_INDEX ? -1 : 1}
        intensity={secretionDrive}
      >
        <path className={styles.organShape} d={GLAND_PATH} />
      </Organ>
    </>
  );
}
