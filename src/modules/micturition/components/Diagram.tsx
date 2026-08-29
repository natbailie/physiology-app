import type { MicturitionDerived } from '../engine/types';
import { BLADDER } from '../engine/constants';
import styles from './Diagram.module.css';

interface DiagramProps {
  derived: MicturitionDerived;
}

export function BladderDiagram({ derived }: DiagramProps) {
  const volumeFraction = derived.bladderVolumeML / BLADDER.MAX_CAPACITY_ML;

  const detrusorWidth = 4 + derived.detrusorTone * 8;
  const sphincterGap = 6 + (1 - derived.externalSphincterTone) * 10;

  const parasympatheticWidth = 1 + derived.parasympatheticActivity * 3;
  const sympatheticWidth = 1 + derived.sympatheticActivity * 3;

  const afferentRadius = 2 + derived.afferentFiringRate * 6;

  return (
    <svg viewBox="0 0 200 220" className={styles.diagram} role="img" aria-label="Bladder diagram">
      {/* Parasympathetic nerve (left) */}
      <line x1="30" y1="40" x2="75" y2="100" stroke="var(--danger)" strokeWidth={parasympatheticWidth} opacity={0.6 + derived.parasympatheticActivity * 0.4} />
      <text x="15" y="35" className={styles.label} fill="var(--danger)" fontSize="7">Pelvic n.</text>

      {/* Sympathetic nerve (right) */}
      <line x1="170" y1="40" x2="125" y2="100" stroke="var(--o2)" strokeWidth={sympatheticWidth} opacity={0.6 + derived.sympatheticActivity * 0.4} />
      <text x="148" y="35" className={styles.label} fill="var(--o2)" fontSize="7">Hypogastric n.</text>

      {/* Afferent nerve (bottom-left) */}
      <line x1="50" y1="185" x2="85" y2="155" stroke="var(--cortisol)" strokeWidth={1 + derived.afferentFiringRate * 2} opacity={0.5 + derived.afferentFiringRate * 0.5} strokeDasharray={derived.afferentFiringRate > 0.5 ? 'none' : '3,3'} />
      <circle cx="45" cy="190" r={afferentRadius} fill="var(--cortisol)" opacity={0.4 + derived.afferentFiringRate * 0.6} />
      <text x="15" y="205" className={styles.label} fill="var(--cortisol)" fontSize="7">Stretch Rx</text>

      {/* Bladder wall (detrusor) */}
      <ellipse
        cx="100"
        cy="140"
        rx={45 + derived.detrusorTone * 5}
        ry={35 + volumeFraction * 25}
        fill="none"
        stroke="var(--artery)"
        strokeWidth={detrusorWidth}
        opacity={0.5 + derived.detrusorTone * 0.5}
      />
      <text x="155" y="140" className={styles.label} fill="var(--artery)" fontSize="7">Detrusor</text>

      {/* Bladder lumen (fill) */}
      <ellipse
        cx="100"
        cy="140"
        rx={40}
        ry={30 + volumeFraction * 22}
        fill="var(--o2)"
        opacity={0.15 + volumeFraction * 0.35}
      />

      {/* Volume text */}
      <text x="100" y="143" textAnchor="middle" className={styles.value} fontSize="11" fill="var(--text)">
        {derived.bladderVolumeML.toFixed(0)} mL
      </text>

      {/* Internal sphincter (smooth muscle ring at bladder neck) */}
      <rect
        x={92 - sphincterGap / 2}
        y={170 + volumeFraction * 20}
        width={sphincterGap}
        height={6}
        rx={3}
        fill="var(--artery)"
        opacity={0.4 + derived.externalSphincterTone * 0.6}
      />

      {/* External sphincter (skeletal muscle ring) */}
      <rect
        x={88 - sphincterGap / 2 - 4}
        y={180 + volumeFraction * 20}
        width={sphincterGap + 8}
        height={8}
        rx={4}
        fill="var(--danger)"
        opacity={0.3 + derived.externalSphincterTone * 0.7}
      />
      <text x="130" y={188 + volumeFraction * 20} className={styles.label} fill="var(--danger)" fontSize="7">Ext. sphincter</text>

      {/* Urethra */}
      <line
        x1="100"
        y1={182 + volumeFraction * 20}
        x2="100"
        y2="215"
        stroke="var(--text)"
        strokeWidth={2 + (1 - derived.externalSphincterTone) * 3}
        opacity={0.4}
      />

      {/* Pressure indicator */}
      <text x="155" y="115" className={styles.label} fill="var(--text)" fontSize="7">
        {derived.intravesicalPressureCmH2O.toFixed(1)} cmH₂O
      </text>

      {/* Net flow arrow */}
      {derived.netFlowRateMLperMin < -10 && (
        <text x="100" y="218" textAnchor="middle" className={styles.value} fontSize="8" fill="var(--o2)">
          ↓ voiding
        </text>
      )}
      {derived.netFlowRateMLperMin > 0 && (
        <text x="100" y="218" textAnchor="middle" className={styles.value} fontSize="8" fill="var(--text)">
          ↑ filling
        </text>
      )}

      {/* Phase label */}
      <text x="100" y="15" textAnchor="middle" className={styles.label} fontSize="9" fill="var(--text)">
        {derived.phase.toUpperCase()}
      </text>
    </svg>
  );
}
