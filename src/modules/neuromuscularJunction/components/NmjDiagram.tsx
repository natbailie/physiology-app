import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { NmjDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface NmjDiagramProps {
  derived: NmjDerived;
}

const BOUTON = { x: 110, y: 56, w: 320, h: 150 };
/** Where vesicles dock and calcium enters. Everything presynaptic happens at these four points. */
const ACTIVE_ZONES = [166, 236, 306, 376];
const MEMBRANE_Y = BOUTON.y + BOUTON.h;
const FOLD = { x0: 120, x1: 404, crest: 252, trough: 290, count: 8 };
const EPP = { x: 470, y: 62, w: 38, h: 228 };

/** The postsynaptic membrane, thrown into junctional folds. Receptors sit on the crests. */
function foldPath(): string {
  const step = (FOLD.x1 - FOLD.x0) / FOLD.count;
  const parts = [`M ${FOLD.x0} ${FOLD.crest}`];
  for (let i = 0; i < FOLD.count; i += 1) {
    const x = FOLD.x0 + i * step;
    parts.push(`Q ${(x + step * 0.25).toFixed(1)} ${FOLD.trough} ${(x + step * 0.5).toFixed(1)} ${FOLD.trough}`);
    parts.push(`Q ${(x + step * 0.75).toFixed(1)} ${FOLD.trough} ${(x + step).toFixed(1)} ${FOLD.crest}`);
  }
  return parts.join(' ');
}

/** Crest x-positions — where acetylcholine receptors are concentrated. */
function crests(): number[] {
  const step = (FOLD.x1 - FOLD.x0) / FOLD.count;
  return Array.from({ length: FOLD.count + 1 }, (_, i) => FOLD.x0 + i * step);
}

/**
 * The neuromuscular junction, drawn as the four structures its four sliders name.
 *
 * The old drawing was a rectangle with eight dots for the terminal, a dashed line for the cleft
 * and a row of small squares for the end plate — against controls for vesicle release, calcium
 * channels, receptor density and cholinesterase. None of the four had anything to change, so
 * every lesion looked identical and only the numbers moved.
 *
 * Now each control owns a structure. Botulism empties the docked vesicles. Lambert-Eaton takes
 * the calcium channels out of the presynaptic membrane. Myasthenia thins the receptors on the
 * fold crests while everything presynaptic carries on normally. An organophosphate strips the
 * cholinesterase out of the cleft so transmitter accumulates. Four visibly different pictures
 * from four different lesions, which is the discrimination the module is teaching.
 */
export function NmjDiagram({ derived }: NmjDiagramProps) {
  const vesicles = clamp(derived.vesicleReleaseCapacity * derived.vesiclePool, 0, 1.5);
  const calcium = clamp(derived.calciumChannelFunction, 0, 1.5);
  const receptors = clamp(derived.receptorDensity, 0, 1.5);
  const esterase = clamp(derived.acetylcholinesteraseActivity, 0, 2);
  const blocked = clamp((derived.nondepolarisingBlocker + derived.depolarisingBlocker) / 100, 0, 1);
  const transmitter = clamp(derived.quantalContent / 60, 0, 1.4);

  // The end-plate potential against the threshold it has to clear. The gap between them IS the
  // safety factor, which is why they are drawn on one scale.
  const eppFraction = clamp(derived.endPlatePotentialMv / 60, 0, 1);
  const thresholdFraction = clamp(derived.endPlatePotentialMv / Math.max(derived.safetyFactor, 0.05) / 60, 0.02, 1);

  const vesiclesPerZone = Math.round(clamp(vesicles, 0, 1.2) * 5);
  const achPerZone = Math.round(transmitter * 4);
  const receptorsPerCrest = Math.round(clamp(receptors, 0, 1.4) * 3);

  return (
    <DiagramFrame
      viewBox="0 0 560 440"
      ariaLabel="The neuromuscular junction: the nerve terminal with docked vesicles and voltage-gated calcium channels at its active zones, the synaptic cleft with acetylcholinesterase, and the postsynaptic junctional folds carrying acetylcholine receptors on their crests"
    >
      {/* ---- Nerve terminal ---- */}
      <path
        className={styles.bouton}
        d={`M ${BOUTON.x} ${MEMBRANE_Y} L ${BOUTON.x} ${BOUTON.y + 40} Q ${BOUTON.x} ${BOUTON.y} ${BOUTON.x + 46} ${BOUTON.y} L ${BOUTON.x + BOUTON.w - 46} ${BOUTON.y} Q ${BOUTON.x + BOUTON.w} ${BOUTON.y} ${BOUTON.x + BOUTON.w} ${BOUTON.y + 40} L ${BOUTON.x + BOUTON.w} ${MEMBRANE_Y} Z`}
      />
      <text className={styles.anatomyStrong} x={BOUTON.x + 12} y={BOUTON.y + 22}>
        Nerve terminal
      </text>

      {/* Reserve pool, drifting above the active zones. */}
      {Array.from({ length: 14 }, (_, i) => (
        <circle
          key={`reserve-${i}`}
          className={styles.vesicleReserve}
          style={{ '--pool': clamp(derived.vesiclePool, 0, 1.3) } as CSSProperties}
          cx={150 + (i % 7) * 42}
          cy={BOUTON.y + 52 + Math.floor(i / 7) * 26}
          r={6}
        />
      ))}

      {ACTIVE_ZONES.map((zx) => (
        <g key={zx}>
          {/* Docked vesicles: what botulinum toxin stops from ever arriving. */}
          {Array.from({ length: vesiclesPerZone }, (_, i) => (
            <circle
              key={`v-${i}`}
              className={styles.vesicleDocked}
              cx={zx - 16 + (i % 3) * 16}
              cy={MEMBRANE_Y - 14 - Math.floor(i / 3) * 15}
              r={6}
            />
          ))}
          {/* The active zone itself: a thickening of the presynaptic membrane. */}
          <rect className={styles.activeZone} x={zx - 22} y={MEMBRANE_Y - 4} width={44} height={5} rx={2} />
          {/* Voltage-gated calcium channels, the Lambert-Eaton target. */}
          {[-16, 16].map((dx) => (
            <rect
              key={dx}
              className={styles.calciumChannel}
              style={{ '--calcium': calcium } as CSSProperties}
              x={zx + dx - 4}
              y={MEMBRANE_Y - 8}
              width={8}
              height={13}
              rx={2}
            />
          ))}
          {/* Acetylcholine crossing the cleft. */}
          {Array.from({ length: achPerZone }, (_, i) => (
            <circle
              key={`ach-${i}`}
              className={styles.transmitter}
              cx={zx - 15 + (i % 4) * 10}
              cy={MEMBRANE_Y + 14 + (i % 2) * 12}
              r={3}
            />
          ))}
        </g>
      ))}
      <text className={styles.anatomy} x={20} y={MEMBRANE_Y - 6}>
        Active zones
      </text>

      {/* ---- Synaptic cleft, and the enzyme in its basal lamina ---- */}
      <text className={styles.anatomy} x={438} y={MEMBRANE_Y + 26}>
        Cleft
      </text>
      {[196, 266, 336, 406].map((ex) => (
        <g key={ex} className={styles.esterase} style={{ '--esterase': esterase } as CSSProperties}>
          <path d={`M ${ex - 6} ${MEMBRANE_Y + 18} L ${ex} ${MEMBRANE_Y + 25} L ${ex + 6} ${MEMBRANE_Y + 18}`} />
          <path d={`M ${ex} ${MEMBRANE_Y + 25} L ${ex} ${MEMBRANE_Y + 32}`} />
        </g>
      ))}
      <text className={styles.anatomy} x={20} y={MEMBRANE_Y + 26}>
        Acetylcholinesterase
      </text>

      {/* ---- Postsynaptic membrane, thrown into folds ---- */}
      <path className={styles.folds} d={foldPath()} />
      {crests().map((cx) =>
        Array.from({ length: receptorsPerCrest }, (_, i) => (
          <rect
            key={`${cx}-${i}`}
            className={i / Math.max(receptorsPerCrest, 1) < blocked ? styles.receptorBlocked : styles.receptor}
            x={cx - 9 + i * 7}
            y={FOLD.crest - 6}
            width={5}
            height={7}
            rx={1.5}
          />
        )),
      )}
      <text className={styles.anatomy} x={FOLD.x1 + 8} y={FOLD.trough}>
        Folds
      </text>
      <text className={styles.anatomy} x={20} y={FOLD.crest + 4}>
        ACh receptors
      </text>

      {/* ---- Muscle fibre ---- */}
      <rect
        className={styles.muscle}
        style={{ '--force': clamp(derived.muscleForcePercent / 100, 0, 1) } as CSSProperties}
        x={110}
        y={304}
        width={320}
        height={44}
        rx={8}
      />
      <text className={styles.anatomyStrong} x={270} y={331} textAnchor="middle">
        Muscle fibre · {derived.muscleForcePercent.toFixed(0)}%
      </text>

      {/* ---- End-plate potential against threshold ---- */}
      <rect className={styles.eppTrack} x={EPP.x} y={EPP.y} width={EPP.w} height={EPP.h} rx={5} />
      <rect
        className={styles.eppFill}
        x={EPP.x}
        y={EPP.y + EPP.h - eppFraction * EPP.h}
        width={EPP.w}
        height={eppFraction * EPP.h}
        rx={5}
      />
      <line
        className={styles.threshold}
        x1={EPP.x - 6}
        x2={EPP.x + EPP.w + 6}
        y1={EPP.y + EPP.h - thresholdFraction * EPP.h}
        y2={EPP.y + EPP.h - thresholdFraction * EPP.h}
      />
      <text className={styles.sideTick} x={EPP.x + EPP.w / 2} y={EPP.y - 8} textAnchor="middle">
        EPP vs threshold
      </text>
      <text className={styles.sideTick} x={EPP.x + EPP.w / 2} y={EPP.y + EPP.h + 16} textAnchor="middle">
        {derived.endPlatePotentialMv.toFixed(0)} mV
      </text>

      {/* ---- Readouts ---- */}
      <text className={styles.label} x={20} y={372}>
        SAFETY FACTOR {derived.safetyFactor.toFixed(2)} · QUANTA {derived.quantalContent.toFixed(0)}
      </text>
      <DiagramText className={styles.caption} x={20} y={392} maxWidth={520}>
        train-of-four {derived.trainOfFourRatio.toFixed(2)} · post-tetanic{' '}
        {derived.postTetanicRatio.toFixed(2)} · desensitisation {(derived.desensitisation * 100).toFixed(0)}%
      </DiagramText>

      <DiagramText className={styles.verdict} x={20} y={416} maxWidth={520} fontSize={15} tracking={0.04}>
        {derived.classification}
      </DiagramText>
      <DiagramText className={styles.label} x={20} y={434} maxWidth={520} fontSize={11} tracking={0.06}>
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
