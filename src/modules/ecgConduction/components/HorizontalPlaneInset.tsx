import { PRECORDIAL_AXES } from '../engine/constants';
import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { LeadName, PrecordialLeadName } from '../engine/types';

interface HorizontalPlaneInsetProps {
  x: number;
  y: number;
  radius: number;
  selectedLead: LeadName;
  /** Live dipole direction in the horizontal plane, and its size. */
  horizontalAngleDegrees: number;
  dipoleMagnitude: number;
}

const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * The chest looked at from above: the six precordial electrodes arranged round the front of
 * the thorax, with the heart's instantaneous vector drawn in the plane they sample.
 *
 * The companion to the hexaxial circle, and the reason the two are shown side by side. The
 * limb leads measure the vector's shadow on one plane and the chest leads its shadow on the
 * other; neither is the whole vector, and a finding invisible in one can be unmissable in the
 * other. An anterior injury barely moves the hexaxial picture and dominates this one.
 */
export function HorizontalPlaneInset({
  x,
  y,
  radius,
  selectedLead,
  horizontalAngleDegrees,
  dipoleMagnitude,
}: HorizontalPlaneInsetProps) {
  // Viewed from above with the patient's left on the right of the picture and ANTERIOR at the
  // top, so the electrodes sit where they would on a chest facing the reader. Anterior is -y
  // in SVG coordinates, hence the negated sine.
  const point = (angleDegrees: number, length: number) => ({
    x: Math.cos(angleDegrees * DEGREES_TO_RADIANS) * length,
    y: -Math.sin(angleDegrees * DEGREES_TO_RADIANS) * length,
  });

  const vectorLength = clamp(dipoleMagnitude * radius * 1.6, 0, radius * 0.95);
  const tip = point(horizontalAngleDegrees, vectorLength);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle className={styles.axisRing} r={radius} />

      {(Object.entries(PRECORDIAL_AXES) as [PrecordialLeadName, number][]).map(([lead, angle]) => {
        const electrode = point(angle, radius);
        const selected = lead === selectedLead;
        const label = point(angle, radius + 10);
        return (
          <g key={lead}>
            <line
              className={selected ? styles.leadAxisSelected : styles.leadAxis}
              x1={0}
              y1={0}
              x2={electrode.x}
              y2={electrode.y}
            />
            <circle
              cx={electrode.x}
              cy={electrode.y}
              r={selected ? 2.6 : 1.8}
              fill={selected ? 'var(--ecg-trace)' : 'var(--text-faint)'}
            />
            <text className={styles.leadLabel} x={label.x} y={label.y + 2} fill={selected ? 'var(--ecg-trace)' : undefined}>
              {lead}
            </text>
          </g>
        );
      })}

      {vectorLength > 1 && <line className={styles.dipoleVector} x1={0} y1={0} x2={tip.x} y2={tip.y} />}
      <circle r={2} fill="var(--text-dim)" />
    </g>
  );
}
