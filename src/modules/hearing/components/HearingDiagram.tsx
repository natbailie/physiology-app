import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { AUDIOGRAM_FREQS_HZ } from '../engine/constants';
import { clamp } from '@/shared/lib/math';
import type { HearingDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface HearingDiagramProps {
  derived: HearingDerived;
}

/** The cochlea, unrolled. Base at the left beside the oval window carries high frequencies;
 * the apex at the right carries low ones. */
const COCHLEA = { x0: 284, x1: 500, cy: 196, baseHalf: 31, apexHalf: 13 };
const SEGMENTS = AUDIOGRAM_FREQS_HZ.length;
const SEG_W = (COCHLEA.x1 - COCHLEA.x0) / SEGMENTS;

/** Half-height of the unrolled duct at a fractional distance from the base. */
const half = (p: number) => COCHLEA.baseHalf - (COCHLEA.baseHalf - COCHLEA.apexHalf) * p;

/** Place of a frequency along the unrolled duct: 8 kHz at the base, 250 Hz at the apex. */
const LO_HZ = AUDIOGRAM_FREQS_HZ[0] as number;
const HI_HZ = AUDIOGRAM_FREQS_HZ[SEGMENTS - 1] as number;

function placeOf(hz: number): number {
  const t = Math.log2(clamp(hz, LO_HZ, HI_HZ) / LO_HZ) / Math.log2(HI_HZ / LO_HZ);
  return 1 - t; // 0 at the base (high frequency), 1 at the apex (low)
}

/**
 * The ear, from pinna to auditory nerve, and the two routes sound can take to reach the cochlea.
 *
 * This module's whole diagnostic content is the air–bone GAP, and neither route was drawn: the
 * diagram was an audiogram with a small basilar-membrane inset beside it. Now the conductive
 * chain is there to be interrupted — canal, drum, malleus, incus, stapes, oval window — and bone
 * conduction is drawn going round it, straight through the temporal bone into the cochlea. A
 * conductive loss is then visibly one route failing while the other does not, which is what a
 * gap IS.
 *
 * The cochlea is unrolled and shaded segment by segment from the BONE-conduction thresholds,
 * because those thresholds are the hair-cell damage map read along the tonotopic axis. The same
 * numbers the audiogram plots against frequency are plotted here against place — so a 4 kHz
 * noise notch appears as damage part-way along the duct rather than as a dip in a line.
 */
export function HearingDiagram({ derived }: HearingDiagramProps) {
  // Conductive transmission: what the middle ear still passes. 60 dB of gap is a chain that has
  // stopped conducting altogether.
  const conduction = clamp(1 - derived.airBoneGapDb / 60, 0.06, 1);
  const place = placeOf(derived.stimulusFrequencyHz);
  const amplitude = clamp(derived.sensationLevelDb, 0, 70) / 70;

  // Travelling wave: a skewed envelope peaking at the stimulus frequency's place.
  const wave: string[] = [`M ${COCHLEA.x0} ${COCHLEA.cy}`];
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const x = COCHLEA.x0 + t * (COCHLEA.x1 - COCHLEA.x0);
    const sigma = 0.15 * (1 + 0.6 * t);
    const g = amplitude * Math.exp(-Math.pow((t - place) / sigma, 2)) * (1 - 0.3 * t);
    wave.push(`L ${x.toFixed(1)} ${(COCHLEA.cy - g * half(t) * 1.6).toFixed(1)}`);
  }

  const duct = `M ${COCHLEA.x0} ${COCHLEA.cy - COCHLEA.baseHalf} L ${COCHLEA.x1} ${COCHLEA.cy - COCHLEA.apexHalf} L ${COCHLEA.x1} ${COCHLEA.cy + COCHLEA.apexHalf} L ${COCHLEA.x0} ${COCHLEA.cy + COCHLEA.baseHalf} Z`;

  return (
    <DiagramFrame
      viewBox="0 0 560 440"
      ariaLabel="The ear in cross-section: external canal, tympanic membrane, ossicular chain and oval window carrying air conduction, bone conduction bypassing them, and the cochlea unrolled along its tonotopic axis with hair-cell loss shaded at each frequency"
      defs={
        <marker id="hearArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
          <path className={styles.arrowHead} d="M 0 0.5 L 7.5 4 L 0 7.5 Z" />
        </marker>
      }
    >
      {/* ---- Temporal bone: what bone conduction travels through ---- */}
      <path className={styles.temporalBone} d="M 176 108 C 280 96, 420 104, 516 128" />
      <text className={styles.anatomy} x={330} y={100} textAnchor="middle">
        Temporal bone
      </text>

      {/* ---- Outer ear ---- */}
      <path className={styles.pinna} d="M 62 150 C 26 158, 26 226, 62 234 C 52 214, 52 172, 62 150 Z" />
      <text className={styles.anatomy} x={44} y={252} textAnchor="middle">
        Pinna
      </text>
      <path className={styles.canal} d="M 62 190 L 166 190" />
      <text className={styles.anatomy} x={112} y={176} textAnchor="middle">
        Canal
      </text>

      {/* ---- Tympanic membrane ---- */}
      <line className={styles.drum} x1={166} y1={166} x2={176} y2={214} />
      <text className={styles.anatomy} x={158} y={230} textAnchor="end">
        Drum
      </text>

      {/* ---- Ossicular chain. Fades as the conductive route fails, which is the gap. ---- */}
      <g className={styles.ossicles} style={{ '--conduction': conduction } as React.CSSProperties}>
        <path d="M 172 182 L 198 172" />
        <circle cx={200} cy={171} r={5.5} />
        <path d="M 204 174 L 230 180" />
        <circle cx={232} cy={181} r={5} />
        <path d="M 236 183 L 266 188" />
        <path d="M 266 178 L 266 198" />
      </g>
      <text className={styles.anatomy} x={214} y={154} textAnchor="middle">
        Malleus · incus · stapes
      </text>

      {/* ---- The two windows ---- */}
      <line className={styles.window} x1={272} y1={176} x2={272} y2={196} />
      <text className={styles.sideTick} x={276} y={168}>
        oval
      </text>
      <line className={styles.window} x1={272} y1={214} x2={272} y2={230} />
      <text className={styles.sideTick} x={266} y={240} textAnchor="end">
        round
      </text>

      {/* ---- The routes. Air goes through the chain; bone goes round it. ---- */}
      <path
        className={styles.airRoute}
        style={{ '--conduction': conduction } as React.CSSProperties}
        d="M 78 190 L 160 190"
        markerEnd="url(#hearArrow)"
      />
      <path className={styles.boneRoute} d="M 232 112 C 300 122, 344 148, 366 172" markerEnd="url(#hearArrow)" />
      <text className={styles.boneLabel} x={252} y={132}>
        bone conduction
      </text>

      {/* ---- Cochlea, unrolled, shaded by hair-cell loss at each place ---- */}
      <path className={styles.cochleaDuct} d={duct} />
      {derived.boneConductionDb.map((db, i) => {
        // Index 0 is the lowest frequency, which sits at the APEX.
        const p0 = 1 - (i + 1) / SEGMENTS;
        const x = COCHLEA.x0 + p0 * (COCHLEA.x1 - COCHLEA.x0);
        const h0 = half(p0);
        const h1 = half(p0 + 1 / SEGMENTS);
        return (
          <path
            key={AUDIOGRAM_FREQS_HZ[i]}
            className={styles.hairCells}
            style={{ '--loss': clamp(db / 90, 0, 1) } as React.CSSProperties}
            d={`M ${x} ${COCHLEA.cy - h0} L ${x + SEG_W} ${COCHLEA.cy - h1} L ${x + SEG_W} ${COCHLEA.cy + h1} L ${x} ${COCHLEA.cy + h0} Z`}
          />
        );
      })}
      <path className={styles.travellingWave} d={wave.join(' ')} />
      <line
        className={styles.placeMark}
        x1={COCHLEA.x0 + place * (COCHLEA.x1 - COCHLEA.x0)}
        y1={COCHLEA.cy - 38}
        x2={COCHLEA.x0 + place * (COCHLEA.x1 - COCHLEA.x0)}
        y2={COCHLEA.cy + 38}
      />
      <text className={styles.anatomy} x={COCHLEA.x1} y={140} textAnchor="end">
        Cochlea
      </text>
      <text className={styles.sideTick} x={COCHLEA.x0 + 4} y={COCHLEA.cy + 50}>
        base · 8 kHz
      </text>
      <text className={styles.sideTick} x={COCHLEA.x1} y={COCHLEA.cy + 46} textAnchor="end">
        apex · 250 Hz
      </text>
      <text className={styles.sideTick} x={COCHLEA.x0 + place * (COCHLEA.x1 - COCHLEA.x0)} y={COCHLEA.cy - 44} textAnchor="middle">
        {derived.stimulusFrequencyHz.toFixed(0)} Hz
      </text>

      {/* ---- Auditory nerve ---- */}
      <path className={styles.nerve} d="M 340 228 C 380 254, 450 262, 512 264" markerEnd="url(#hearArrow)" />
      <text className={styles.anatomy} x={512} y={280} textAnchor="end">
        Auditory nerve
      </text>

      {/* ---- Readouts ---- */}
      <text className={styles.label} x={20} y={300}>
        PTA {derived.ptaDb.toFixed(0)} dB · air-bone gap {derived.airBoneGapDb.toFixed(0)} dB
      </text>
      <DiagramText className={styles.caption} x={20} y={318} maxWidth={520}>
        Rinne {derived.rinneResult} · Weber {derived.weberResult}
      </DiagramText>
      <DiagramText className={styles.caption} x={20} y={334} maxWidth={520}>
        discrimination {derived.speechDiscriminationPct.toFixed(0)}% · recruitment ×
        {derived.recruitmentIndex.toFixed(2)}
      </DiagramText>
      <DiagramText className={styles.caption} x={20} y={350} maxWidth={520}>
        stimulus {derived.stimulusLevelDbHl.toFixed(0)} dB HL · sensation level{' '}
        {derived.sensationLevelDb.toFixed(0)} dB · loudness {derived.loudnessPct.toFixed(0)}%
      </DiagramText>
      {derived.airBoneGapDb >= 15 && (
        <text className={styles.alarm} x={20} y={370}>
          conductive gap — the chain, not the cochlea
        </text>
      )}

      <DiagramText className={styles.verdict} x={20} y={392} maxWidth={520} fontSize={15} tracking={0.04}>
        {derived.classification}
      </DiagramText>
      <DiagramText className={styles.label} x={20} y={412} maxWidth={520} fontSize={11} tracking={0.06}>
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
