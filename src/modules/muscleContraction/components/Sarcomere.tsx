import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface SarcomereProps {
  centerX: number;
  centerY: number;
  /** Sarcomere length in µm — drives Z-disc separation and therefore filament overlap. */
  lengthUm: number;
  attachedFraction: number;
}

/** 1 µm of sarcomere = 100 px of diagram. */
const PX_PER_UM = 100;
/** Thick and thin filament lengths, µm. Fixed — the sliding filament theory in one constant:
 * the filaments never change length, only how far they slide past each other. */
const THICK_FILAMENT_UM = 1.6;
const THIN_FILAMENT_UM = 1;
const BRIDGE_SPACING_PX = 13;

/**
 * One sarcomere, drawn to scale. The Z-discs move apart as length rises, the filaments keep
 * their length, and cross-bridges are drawn only where thick and thin filaments actually
 * overlap — so the length-tension curve is visibly a statement about geometry.
 */
export function Sarcomere({ centerX, centerY, lengthUm, attachedFraction }: SarcomereProps) {
  const halfLength = (lengthUm * PX_PER_UM) / 2;
  const zLeft = centerX - halfLength;
  const zRight = centerX + halfLength;

  const thickHalf = (THICK_FILAMENT_UM * PX_PER_UM) / 2;
  const thickLeft = centerX - thickHalf;
  const thickRight = centerX + thickHalf;

  const thinLength = THIN_FILAMENT_UM * PX_PER_UM;
  const leftThinEnd = zLeft + thinLength;
  const rightThinStart = zRight - thinLength;

  // Cross-bridges exist only where a myosin head faces an actin filament.
  const bridges: { x: number; up: boolean }[] = [];
  for (let x = thickLeft + BRIDGE_SPACING_PX / 2; x < thickRight; x += BRIDGE_SPACING_PX) {
    const facesLeftThin = x <= leftThinEnd;
    const facesRightThin = x >= rightThinStart;
    if (facesLeftThin || facesRightThin) bridges.push({ x, up: facesLeftThin });
  }

  const bridgeStyle = { '--attached': attachedFraction } as CSSProperties;
  const leftOverlap = Math.max(0, Math.min(leftThinEnd, thickRight) - thickLeft);
  const rightOverlap = Math.max(0, thickRight - Math.max(rightThinStart, thickLeft));

  return (
    <g>
      {leftOverlap > 0 && <rect className={styles.overlapBand} x={thickLeft} y={centerY - 20} width={leftOverlap} height={40} />}
      {rightOverlap > 0 && (
        <rect className={styles.overlapBand} x={thickRight - rightOverlap} y={centerY - 20} width={rightOverlap} height={40} />
      )}

      {/* Z-discs: what actually moves when a muscle shortens. */}
      <line className={styles.zDisc} x1={zLeft} y1={centerY - 26} x2={zLeft} y2={centerY + 26} />
      <line className={styles.zDisc} x1={zRight} y1={centerY - 26} x2={zRight} y2={centerY + 26} />
      <text className={styles.zLabel} x={zLeft} y={centerY + 40}>
        Z
      </text>
      <text className={styles.zLabel} x={zRight} y={centerY + 40}>
        Z
      </text>

      {/* Thin filaments, anchored to each Z-disc and pointing inward. */}
      <line className={styles.thinFilament} x1={zLeft} y1={centerY - 11} x2={leftThinEnd} y2={centerY - 11} />
      <line className={styles.thinFilament} x1={zRight} y1={centerY + 11} x2={rightThinStart} y2={centerY + 11} />

      {/* Thick filament, always the same length and always centred. */}
      <line className={styles.thickFilament} x1={thickLeft} y1={centerY} x2={thickRight} y2={centerY} />

      {bridges.map((bridge) => (
        <line
          key={bridge.x}
          className={styles.crossBridge}
          style={bridgeStyle}
          x1={bridge.x}
          y1={centerY}
          x2={bridge.x}
          y2={bridge.up ? centerY - 10 : centerY + 10}
        />
      ))}
    </g>
  );
}
