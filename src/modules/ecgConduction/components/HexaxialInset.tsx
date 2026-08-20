import { LEAD_AXES } from '../engine/constants';
import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { LeadName } from '../engine/types';

interface HexaxialInsetProps {
  x: number;
  y: number;
  radius: number;
  selectedLead: LeadName;
  /** Live dipole direction and size, so the vector can be watched swinging through the beat. */
  dipoleAngleDegrees: number;
  dipoleMagnitude: number;
  meanQrsAxisDegrees: number;
}

const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * The hexaxial reference circle: all six limb-lead axes, with the selected one highlighted and
 * the heart's instantaneous dipole drawn as an arrow.
 *
 * This is what makes the lead selector make sense — the trace changes not because the heart is
 * doing anything different, but because a different axis is being projected onto.
 */
export function HexaxialInset({ x, y, radius, selectedLead, dipoleAngleDegrees, dipoleMagnitude, meanQrsAxisDegrees }: HexaxialInsetProps) {
  // SVG's y axis already points down, matching the hexaxial convention where +90° is inferior.
  const point = (angleDegrees: number, length: number) => ({
    x: Math.cos(angleDegrees * DEGREES_TO_RADIANS) * length,
    y: Math.sin(angleDegrees * DEGREES_TO_RADIANS) * length,
  });

  // Scaled so a full-size QRS vector reaches most of the way to the ring.
  const vectorLength = clamp(dipoleMagnitude * radius * 1.6, 0, radius * 0.95);
  const tip = point(dipoleAngleDegrees, vectorLength);
  const meanTip = point(meanQrsAxisDegrees, radius * 0.72);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle className={styles.axisRing} r={radius} />

      {(Object.entries(LEAD_AXES) as [LeadName, number][]).map(([lead, angle]) => {
        const positive = point(angle, radius);
        const negative = point(angle, -radius);
        const selected = lead === selectedLead;
        const label = point(angle, radius + 9);
        return (
          <g key={lead}>
            <line
              className={selected ? styles.leadAxisSelected : styles.leadAxis}
              x1={negative.x}
              y1={negative.y}
              x2={positive.x}
              y2={positive.y}
            />
            <text className={styles.leadLabel} x={label.x} y={label.y + 2} fill={selected ? 'var(--ecg-trace)' : undefined}>
              {lead}
            </text>
          </g>
        );
      })}

      {/* Mean QRS axis — the steady direction the ventricles depolarise in overall. */}
      <line className={styles.leadAxis} x1={0} y1={0} x2={meanTip.x} y2={meanTip.y} strokeDasharray="3 3" />

      {vectorLength > 1 && <line className={styles.dipoleVector} x1={0} y1={0} x2={tip.x} y2={tip.y} />}
      <circle r={2} fill="var(--text-dim)" />
    </g>
  );
}
