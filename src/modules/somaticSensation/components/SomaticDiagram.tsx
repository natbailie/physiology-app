import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { SomaticDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface SomaticDiagramProps {
  derived: SomaticDerived;
}

/** Cord cross-section, drawn dorsal-up with the patient's left on the viewer's right so it
 * pairs with the body maps beside it. */
const CORD = { cx: 146, cy: 150, r: 88 };
const RAD = Math.PI / 180;

/** A wedge of white matter between two radii, positioned by angle — 0° lateral, -90° dorsal,
 * +90° ventral. Tracts sit where they actually sit rather than in labelled boxes. */
function sector(r0: number, r1: number, a0: number, a1: number): string {
  const p = (r: number, a: number) =>
    `${(CORD.cx + r * Math.cos(a * RAD)).toFixed(1)} ${(CORD.cy + r * Math.sin(a * RAD)).toFixed(1)}`;
  return `M ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

/** Half of the grey-matter butterfly, in cord-local coordinates. Mirrored for the other side. */
const GREY_HALF =
  'M 5 -54 C 16 -55, 27 -46, 29 -32 C 32 -20, 34 -12, 30 -4 C 42 2, 52 16, 47 30 ' +
  'C 42 44, 22 46, 15 34 C 9 25, 8 14, 8 6 L 5 6 Z';

/** A front-facing silhouette, used twice: once per modality, shaded per side by what is lost. */
const BODY =
  'M 32 2 a 11 11 0 1 1 -0.1 0 M 22 24 L 42 24 C 48 24 50 28 50 34 L 58 66 L 50 70 L 46 44 ' +
  'L 46 72 L 42 118 L 34 118 L 32 78 L 30 118 L 22 118 L 18 72 L 18 44 L 14 70 L 6 66 ' +
  'L 14 34 C 14 28 16 24 22 24 Z';

/** Percentage preserved to the opacity of the "lost" wash over that half of the body. */
const lossFill = (preservedPct: number) => clamp((100 - preservedPct) / 100, 0, 1);

function BodyMap({
  x,
  y,
  title,
  leftPct,
  rightPct,
  clipId,
}: {
  x: number;
  y: number;
  title: string;
  leftPct: number;
  rightPct: number;
  clipId: string;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <text className={styles.anatomy} x={32} y={-8} textAnchor="middle">
        {title}
      </text>
      <clipPath id={clipId}>
        <path d={BODY} />
      </clipPath>
      {/* Patient's right is the viewer's left, matching the cord above. */}
      <rect className={styles.lossWash} x={0} y={0} width={32} height={120} clipPath={`url(#${clipId})`} opacity={lossFill(rightPct)} />
      <rect className={styles.lossWash} x={32} y={0} width={32} height={120} clipPath={`url(#${clipId})`} opacity={lossFill(leftPct)} />
      <path className={styles.bodyOutline} d={BODY} />
      <text className={styles.sideTick} x={8} y={132}>
        R {rightPct.toFixed(0)}%
      </text>
      <text className={styles.sideTick} x={56} y={132}>
        L {leftPct.toFixed(0)}%
      </text>
    </g>
  );
}

/**
 * The spinal cord in cross-section, and the two places sensory fibres cross the midline.
 *
 * Every preset in this module is a lesion defined by WHERE in the cord it sits — Brown-Séquard,
 * anterior cord, syringomyelia, transection — and the old drawing was four rectangles on a
 * rounded box. The cord now has grey matter, a central canal, and its tracts positioned where
 * they belong: dorsal columns posteromedially, spinothalamic anterolaterally.
 *
 * The inset beside it is the thing that makes Brown-Séquard legible at all. Pain and temperature
 * cross within a segment or two of entering; vibration and touch stay ipsilateral all the way to
 * the medulla. Hemisection therefore takes vibration on the SAME side and pain on the OTHER, and
 * no arrangement of coloured boxes can say that — only drawing where each fibre crosses can.
 */
export function SomaticDiagram({ derived }: SomaticDiagramProps) {
  // A tract's shading is its integrity. Dorsal columns carry their own side; a spinothalamic
  // tract carries the OTHER side's pain, which is exactly the confusion the inset resolves.
  const dcRight = derived.touchRightPct;
  const dcLeft = derived.touchLeftPct;
  const stRightCarriesLeftPain = derived.painTempLeftPct;
  const stLeftCarriesRightPain = derived.painTempRightPct;

  const gate = clamp(derived.gateOpenFraction, 0, 1);
  const syrinx = clamp((100 - derived.segmentalPainTempPct) / 100, 0, 1);

  const tract = (pct: number) => ({ '--integrity': clamp(pct / 100, 0, 1) }) as React.CSSProperties;

  return (
    <DiagramFrame
      viewBox="0 0 560 440"
      ariaLabel="Spinal cord in cross-section with the dorsal columns and spinothalamic tracts, the levels at which each crosses the midline, and the resulting modality loss on each side of the body"
    >
      {/* ---- Cord cross-section ---- */}
      <text className={styles.anatomyStrong} x={CORD.cx} y={30} textAnchor="middle">
        Cord below the lesion
      </text>

      <circle className={styles.cordOutline} cx={CORD.cx} cy={CORD.cy} r={CORD.r} />

      {/* Dorsal columns: posteromedial, either side of the posterior median septum. */}
      <path className={styles.columnDC} style={tract(dcRight)} d={sector(46, 84, -145, -95)} />
      <path className={styles.columnDC} style={tract(dcLeft)} d={sector(46, 84, -85, -35)} />
      {/* Spinothalamic: anterolateral. */}
      <path className={styles.columnST} style={tract(stRightCarriesLeftPain)} d={sector(48, 84, 105, 155)} />
      <path className={styles.columnST} style={tract(stLeftCarriesRightPain)} d={sector(48, 84, 25, 75)} />

      {/* Grey matter, drawn as one half mirrored, with the commissure joining them. */}
      <g transform={`translate(${CORD.cx}, ${CORD.cy})`}>
        <path className={styles.greyMatter} d={GREY_HALF} />
        <path className={styles.greyMatter} d={GREY_HALF} transform="scale(-1, 1)" />
        <rect className={styles.greyMatter} x={-6} y={-9} width={12} height={18} />

        {/* The dorsal horn is where the gate is, so the gate is shown there rather than as a
            bar chart parked to one side. */}
        <ellipse
          className={styles.dorsalHorn}
          style={{ '--gate': gate } as React.CSSProperties}
          cx={-24}
          cy={-38}
          rx={11}
          ry={13}
        />
        <ellipse
          className={styles.dorsalHorn}
          style={{ '--gate': gate } as React.CSSProperties}
          cx={24}
          cy={-38}
          rx={11}
          ry={13}
        />

        <circle className={styles.centralCanal} cx={0} cy={0} r={3.5} />
        {/* A syrinx expands from the central canal into the anterior commissure, taking the
            crossing pain fibres of those segments and sparing everything that does not cross
            there — the cape. */}
        {syrinx > 0.03 && (
          <ellipse className={styles.syrinxCavity} cx={0} cy={1} rx={4 + syrinx * 26} ry={3 + syrinx * 13} />
        )}
      </g>

      <text className={styles.sideTick} x={CORD.cx - 66} y={CORD.cy + 106} textAnchor="middle">
        Right
      </text>
      <text className={styles.sideTick} x={CORD.cx + 66} y={CORD.cy + 106} textAnchor="middle">
        Left
      </text>
      <text className={styles.anatomy} x={CORD.cx} y={CORD.cy - 96} textAnchor="middle">
        Dorsal columns
      </text>
      <text className={styles.anatomy} x={CORD.cx} y={CORD.cy + 122} textAnchor="middle">
        Spinothalamic
      </text>

      {/* ---- Where each modality crosses ---- */}
      <text className={styles.anatomyStrong} x={258} y={44}>
        Where each crosses
      </text>
      <line className={styles.levelLine} x1={266} y1={72} x2={548} y2={72} />
      <text className={styles.sideTick} x={266} y={66}>
        Medulla
      </text>
      <line className={styles.levelLine} x1={266} y1={168} x2={548} y2={168} />
      <text className={styles.sideTick} x={266} y={182}>
        Cord segment · fibres enter here
      </text>
      <line className={styles.midline} x1={407} y1={56} x2={407} y2={176} />

      {/* Pain and temperature: synapses and crosses at the segment, ascends contralaterally. */}
      <path className={styles.painFibre} d="M 486 168 L 486 156 C 486 142 470 138 448 138 L 366 138 C 348 138 344 130 344 116 L 344 56" />
      <text className={styles.painLabel} x={492} y={158}>
        pain
      </text>
      {/* Vibration and touch: ipsilateral the whole way, crossing only in the medulla. */}
      <path className={styles.touchFibre} d="M 524 168 L 524 92 C 524 78 512 72 494 72 L 400 72 C 384 72 378 68 378 56" />
      <text className={styles.touchLabel} x={530} y={158}>
        touch
      </text>

      <DiagramText className={styles.caption} x={266} y={204} maxWidth={282}>
        pain crosses at the segment · touch crosses in the medulla
      </DiagramText>

      {/* ---- What survives below, per side ---- */}
      <BodyMap x={286} y={252} title="Vibration &amp; touch" leftPct={dcLeft} rightPct={dcRight} clipId="somaticBodyDc" />
      <BodyMap x={440} y={252} title="Pain &amp; temperature" leftPct={derived.painTempLeftPct} rightPct={derived.painTempRightPct} clipId="somaticBodySt" />

      {/* ---- Readouts ---- */}
      <text className={styles.label} x={20} y={286}>
        Dorsal horn gate {Math.round(gate * 100)}% open
      </text>
      <DiagramText className={styles.caption} x={20} y={304} maxWidth={230}>
        C-fibre {derived.cFibreTraffic.toFixed(0)} · Aδ {derived.adDeltaTraffic.toFixed(0)} · Aβ{' '}
        {derived.abTraffic.toFixed(0)}
      </DiagramText>
      <DiagramText className={styles.caption} x={20} y={332} maxWidth={250}>
        first pain {derived.firstPainLatencyMs.toFixed(0)} ms · second {derived.secondPainLatencyMs.toFixed(0)} ms
      </DiagramText>
      <text className={styles.headline} x={20} y={358}>
        pain {derived.perceivedPainScore.toFixed(1)}/10
      </text>
      {derived.allodyniaActive && (
        <text className={styles.alarm} x={20} y={382}>
          allodynia — Aβ now driving pain
        </text>
      )}

      <DiagramText className={styles.verdict} x={20} y={410} maxWidth={520} fontSize={15} tracking={0.04}>
        {derived.classification}
      </DiagramText>
      <DiagramText className={styles.label} x={20} y={430} maxWidth={520} fontSize={11} tracking={0.06}>
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
