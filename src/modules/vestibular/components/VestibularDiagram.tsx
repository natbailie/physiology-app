import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { VestibularDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface VestibularDiagramProps {
  derived: VestibularDerived;
}

const RESTING_RATE = 90;

interface LabyrinthProps {
  cx: number;
  cy: number;
  /** +1 draws the lateral side to the right (patient's left ear), -1 to the left. */
  lateral: 1 | -1;
  firing: number;
  debris: number;
  otolith: number;
  label: string;
}

/**
 * One labyrinth: three semicircular canals in their three planes, the ampulla at the end of
 * each, and the otolith organs in the middle.
 *
 * Only the horizontal pair and the posterior canal are modelled by the engine — the horizontal
 * canals carry the firing rates and the posterior one carries BPPV debris. The anterior canal
 * is drawn because it is there; nothing in the model moves it.
 */
function Labyrinth({ cx, cy, lateral, firing, debris, otolith, label }: LabyrinthProps) {
  const ampX = cx + lateral * 50;
  const drive = clamp(firing / (RESTING_RATE * 2), 0, 1);
  return (
    <g>
      {/* Three canals, in three planes. */}
      <ellipse className={styles.canal} cx={cx} cy={cy} rx={50} ry={21} />
      <ellipse className={styles.canal} cx={cx} cy={cy} rx={46} ry={20} transform={`rotate(-52 ${cx} ${cy})`} />
      <ellipse className={styles.canalPosterior} style={{ '--debris': debris } as CSSProperties} cx={cx} cy={cy} rx={46} ry={20} transform={`rotate(52 ${cx} ${cy})`} />

      {/* Canalith debris, which is what makes BPPV positional and posterior. */}
      {debris > 0.05 &&
        [0, 1, 2].map((i) => (
          <circle
            key={i}
            className={styles.canalith}
            style={{ '--debris': debris } as CSSProperties}
            cx={cx + lateral * (18 + i * 7)}
            cy={cy + 26 - i * 6}
            r={2.6}
          />
        ))}

      {/* The horizontal ampulla, where the cupula sits and the firing rate is set. */}
      <circle className={styles.ampulla} style={{ '--drive': drive } as CSSProperties} cx={ampX} cy={cy} r={11} />
      <text className={styles.rate} x={ampX} y={cy - 20} textAnchor="middle">
        {firing.toFixed(0)}
      </text>
      <text className={styles.sideTick} x={ampX} y={cy - 36} textAnchor="middle">
        spk/s
      </text>

      {/* Utricle and saccule: the otoliths. Unsteadiness, not vertigo. */}
      <ellipse className={styles.otolith} style={{ '--otolith': otolith } as CSSProperties} cx={cx} cy={cy - 4} rx={12} ry={8} />
      <ellipse className={styles.otolith} style={{ '--otolith': otolith } as CSSProperties} cx={cx} cy={cy + 12} rx={9} ry={7} />

      <text className={styles.anatomyStrong} x={cx} y={cy + 70} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

/**
 * Both labyrinths, and the push-pull between them.
 *
 * A vestibular nerve at rest fires about ninety spikes a second on each side, and the brain
 * reads the DIFFERENCE. That is why a destructive lesion produces violent vertigo while a
 * bilateral loss produces none — and why central compensation, which rebalances the difference
 * without restoring either side, abolishes the nystagmus and leaves the head impulse positive.
 *
 * The old drawing showed two arcs and two firing rates, which cannot express a difference.
 * The beam across the middle can: it tilts toward whichever side is firing harder, sits level
 * when they match, and sits level again once compensation has done its work even though both
 * rates are still wrong.
 */
export function VestibularDiagram({ derived }: VestibularDiagramProps) {
  const right = derived.canalFiringRightSpikesPerSec;
  const left = derived.canalFiringLeftSpikesPerSec;
  const imbalance = clamp(derived.firingImbalanceSpikesPerSec / RESTING_RATE, -1, 1);
  const debris = clamp(derived.canalithDebris, 0, 1);
  const otolith = clamp(derived.otolithFunction, 0, 1);
  const slip = clamp(derived.slowPhaseVelocityDegPerSec / 40, -1, 1);

  return (
    <DiagramFrame
      viewBox="0 0 560 440"
      ariaLabel="Both vestibular labyrinths with their three semicircular canals, ampullae and otolith organs, the resting firing rate of each horizontal canal, and the imbalance between the two sides that produces nystagmus"
      defs={
        <marker id="vestArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto">
          <path className={styles.arrowHead} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
        </marker>
      }
    >
      {/* ---- The push-pull, as a beam that tilts toward the stronger side ---- */}
      <text className={styles.label} x={280} y={40} textAnchor="middle">
        PUSH-PULL BETWEEN THE TWO SIDES
      </text>
      <line className={styles.beamPivot} x1={280} y1={58} x2={280} y2={94} />
      <g transform={`rotate(${(imbalance * 12).toFixed(2)} 280 68)`}>
        <line className={styles.beam} x1={150} y1={68} x2={410} y2={68} />
        <circle className={styles.beamEnd} cx={150} cy={68} r={5} />
        <circle className={styles.beamEnd} cx={410} cy={68} r={5} />
      </g>
      <text className={styles.sideTick} x={280} y={106} textAnchor="middle">
        peripheral imbalance {derived.firingImbalanceSpikesPerSec.toFixed(0)} spk/s
      </text>
      <text className={styles.sideTick} x={280} y={120} textAnchor="middle">
        compensation does not level this — it stops the brain believing it
      </text>

      {/* ---- The two labyrinths ---- */}
      <Labyrinth cx={136} cy={186} lateral={-1} firing={right} debris={debris} otolith={otolith} label="Right labyrinth" />
      <Labyrinth cx={424} cy={186} lateral={1} firing={left} debris={debris} otolith={otolith} label="Left labyrinth" />


      {/* ---- Vestibular nerves into the brainstem ---- */}
      <path className={styles.nerve} d="M 186 200 C 226 216, 244 226, 250 238" markerEnd="url(#vestArrow)" />
      <path className={styles.nerve} d="M 374 200 C 334 216, 316 226, 310 238" markerEnd="url(#vestArrow)" />
      <rect className={styles.brainstem} x={246} y={238} width={68} height={52} rx={10} />
      <text className={styles.anatomyStrong} x={280} y={262} textAnchor="middle">
        Brainstem
      </text>
      <text className={styles.sideTick} x={280} y={278} textAnchor="middle">
        reads the difference
      </text>

      {/* ---- What the imbalance produces ---- */}
      <text className={styles.label} x={20} y={318}>
        NYSTAGMUS
      </text>
      <line className={styles.slipTrack} x1={20} y1={336} x2={240} y2={336} />
      {Math.abs(slip) > 0.02 && (
        <line
          className={styles.slipArrow}
          x1={130}
          y1={336}
          x2={130 + slip * 100}
          y2={336}
          markerEnd="url(#vestArrow)"
        />
      )}
      <text className={styles.sideTick} x={20} y={354}>
        slow phase {derived.slowPhaseVelocityDegPerSec.toFixed(1)}°/s
      </text>

      <text className={styles.caption} x={300} y={320}>
        VOR gain {derived.vorGain.toFixed(2)}
      </text>
      <text className={styles.caption} x={300} y={338}>
        head impulse {derived.headImpulsePositive ? 'positive' : 'negative'}
      </text>
      <text className={styles.caption} x={300} y={356}>
        vertigo {derived.vertigoIntensityPct.toFixed(0)}% · Romberg{' '}
        {derived.rombergUnsteadinessPct.toFixed(0)}%
      </text>
      <text className={styles.caption} x={300} y={374}>
        compensation {(derived.centralCompensation * 100).toFixed(0)}%
      </text>

      <DiagramText className={styles.verdict} x={20} y={400} maxWidth={520} fontSize={15} tracking={0.04}>
        {derived.classification}
      </DiagramText>
      <DiagramText className={styles.label} x={20} y={422} maxWidth={520} fontSize={11} tracking={0.06}>
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
