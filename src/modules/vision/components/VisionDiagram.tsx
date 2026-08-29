import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { AQUEOUS } from '../engine/constants';
import type { EyeFieldSectors, FieldLesionSite, VisionDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface VisionDiagramProps {
  derived: VisionDerived;
}

/** Where each lesion the engine models actually sits on the pathway. Marking the site is the
 * point of the redraw: the field defect is a consequence of position, not a separate fact. */
const LESION_AT: Record<FieldLesionSite, { x: number; y: number; label: string } | null> = {
  none: null,
  rightOpticNerve: { x: 168, y: 322, label: 'optic nerve' },
  leftOpticNerve: { x: 392, y: 322, label: 'optic nerve' },
  chiasmalCentre: { x: 280, y: 280, label: 'chiasm' },
  rightOpticTract: { x: 216, y: 242, label: 'optic tract' },
  leftOpticTract: { x: 344, y: 242, label: 'optic tract' },
  rightTemporalRadiation: { x: 146, y: 198, label: "Meyer's loop" },
  leftTemporalRadiation: { x: 414, y: 198, label: "Meyer's loop" },
  rightParietalRadiation: { x: 207, y: 134, label: 'parietal radiation' },
  leftParietalRadiation: { x: 353, y: 134, label: 'parietal radiation' },
  rightOccipitalLobe: { x: 200, y: 76, label: 'occipital lobe' },
  leftOccipitalLobe: { x: 360, y: 76, label: 'occipital lobe' },
};

const QUAD = 30;

/**
 * One eye's field, quadrant by quadrant, drawn as the patient sees it — so the temporal half
 * faces outward and a pair of charts mirror one another.
 */
function FieldChart({
  x,
  y,
  sectors,
  temporalOnLeft,
  title,
}: {
  x: number;
  y: number;
  sectors: EyeFieldSectors;
  temporalOnLeft: boolean;
  title: string;
}) {
  const outerX = x + (temporalOnLeft ? 0 : QUAD);
  const innerX = x + (temporalOnLeft ? QUAD : 0);
  const cls = (kept: number) => (kept > 0.5 ? styles.fieldQuadKept : styles.fieldQuadLost);
  return (
    <g>
      <text className={styles.anatomy} x={x + QUAD} y={y - 8} textAnchor="middle">
        {title}
      </text>
      <rect className={cls(sectors.superiorTemporal)} x={outerX} y={y} width={QUAD} height={QUAD} />
      <rect className={cls(sectors.inferiorTemporal)} x={outerX} y={y + QUAD} width={QUAD} height={QUAD} />
      <rect className={cls(sectors.superiorNasal)} x={innerX} y={y} width={QUAD} height={QUAD} />
      <rect className={cls(sectors.inferiorNasal)} x={innerX} y={y + QUAD} width={QUAD} height={QUAD} />
      <rect className={styles.fieldFrame} x={x} y={y} width={QUAD * 2} height={QUAD * 2} />
      <text className={styles.fieldLetter} x={outerX + 4} y={y + 11}>
        T
      </text>
      <text className={styles.fieldLetter} x={innerX + 4} y={y + 11}>
        N
      </text>
    </g>
  );
}

/**
 * The visual pathway, from retina to occipital cortex.
 *
 * Twelve of this module's presets are lesions at named points along that pathway — optic
 * neuritis, chiasmal compression, Meyer's loop, occipital infarct — and the old drawing showed
 * two pupils, two field squares and a luminance curve. Nothing connected the site to the defect,
 * so the module's central claim, that the site draws the pattern, had to be taken on faith.
 *
 * Fibres are coloured by the HEMIFIELD they carry rather than by the eye they came from. Before
 * the chiasm each optic nerve carries both colours; after it each tract carries one. That colour
 * sort IS the decussation, and it is why a chiasmal lesion takes both temporal fields while a
 * tract lesion takes the same side of both.
 */
export function VisionDiagram({ derived }: VisionDiagramProps) {
  const pupilR = derived.pupilRightMm * 2.6;
  const pupilL = derived.pupilLeftMm * 2.6;
  const lesion = LESION_AT[derived.fieldLesionSite];

  return (
    <DiagramFrame
      viewBox="0 0 560 440"
      ariaLabel="The visual pathway from both retinas through the optic chiasm, tracts, lateral geniculate nuclei and optic radiations to the occipital cortex, with the lesion marked at its site and the resulting field defect in each eye"
    >
      {/* ---- What each eye sees: the consequence, at the top ---- */}
      <FieldChart x={20} y={34} sectors={derived.fieldSectors.rightEye} temporalOnLeft title="Right eye" />
      <FieldChart x={480} y={34} sectors={derived.fieldSectors.leftEye} temporalOnLeft={false} title="Left eye" />

      {/* ---- Occipital cortex ---- */}
      <rect className={styles.cortex} x={150} y={58} width={100} height={34} rx={8} />
      <rect className={styles.cortex} x={310} y={58} width={100} height={34} rx={8} />
      <text className={styles.anatomy} x={280} y={40} textAnchor="middle">
        Occipital cortex
      </text>
      <text className={styles.sideTick} x={200} y={80} textAnchor="middle">
        right
      </text>
      <text className={styles.sideTick} x={360} y={80} textAnchor="middle">
        left
      </text>

      {/* ---- Optic radiations: two bundles, and Meyer's loop swings forward ---- */}
      <path className={styles.fibreLeftField} d="M 204 178 C 208 150, 208 120, 206 94" />
      <path className={styles.fibreLeftField} d="M 188 180 C 156 186, 142 214, 148 176 C 154 138, 168 112, 180 94" />
      <path className={styles.fibreRightField} d="M 356 178 C 352 150, 352 120, 354 94" />
      <path className={styles.fibreRightField} d="M 372 180 C 404 186, 418 214, 412 176 C 406 138, 392 112, 380 94" />
      <text className={styles.anatomy} x={126} y={214} textAnchor="middle">
        Meyer&rsquo;s loop
      </text>

      {/* ---- Lateral geniculate nuclei ---- */}
      <ellipse className={styles.lgn} cx={198} cy={190} rx={19} ry={12} />
      <ellipse className={styles.lgn} cx={362} cy={190} rx={19} ry={12} />
      <text className={styles.sideTick} x={198} y={193} textAnchor="middle">
        LGN
      </text>
      <text className={styles.sideTick} x={362} y={193} textAnchor="middle">
        LGN
      </text>

      {/* ---- Nerves, chiasm and tracts. Colour is the hemifield the fibres carry, so the
              chiasm is visibly a sorting office rather than a junction. ---- */}
      <path className={styles.fibreLeftField} d="M 152 348 C 176 320, 224 300, 252 284 C 228 258, 206 228, 199 203" />
      <path className={styles.fibreRightField} d="M 200 348 C 214 326, 244 300, 266 286 C 300 272, 340 232, 358 205" />
      <path className={styles.fibreRightField} d="M 408 348 C 384 320, 336 300, 308 284 C 332 258, 354 228, 361 203" />
      <path className={styles.fibreLeftField} d="M 360 348 C 346 326, 316 300, 294 286 C 260 272, 220 232, 202 205" />

      <ellipse className={styles.chiasm} cx={280} cy={284} rx={34} ry={17} />
      <text className={styles.anatomy} x={280} y={312} textAnchor="middle">
        Optic chiasm
      </text>

      {/* ---- The eyes, with their live pupils ---- */}
      <circle className={styles.eyeOutline} cx={176} cy={366} r={30} />
      <circle className={styles.eyeOutline} cx={384} cy={366} r={30} />
      <circle className={styles.iris} cx={176} cy={366} r={Math.max(pupilR + 5, 11)} />
      <circle className={styles.iris} cx={384} cy={366} r={Math.max(pupilL + 5, 11)} />
      <circle className={styles.pupil} cx={176} cy={366} r={pupilR} />
      <circle className={styles.pupil} cx={384} cy={366} r={pupilL} />
      <text className={styles.sideTick} x={176} y={410} textAnchor="middle">
        R {derived.pupilRightMm.toFixed(1)} mm
      </text>
      <text className={styles.sideTick} x={384} y={410} textAnchor="middle">
        L {derived.pupilLeftMm.toFixed(1)} mm
      </text>

      {/* Torch beams, when the swinging-torch test is running. */}
      {derived.directReflexRightScore > 2 && (
        <line className={styles.torchBeam} x1={104} y1={420} x2={158} y2={382} />
      )}
      {derived.directReflexLeftScore > 2 && (
        <line className={styles.torchBeam} x1={456} y1={420} x2={402} y2={382} />
      )}

      {/* ---- The lesion, drawn where it is ---- */}
      {lesion && (
        <g className={styles.lesionMark}>
          <line x1={lesion.x - 11} y1={lesion.y - 11} x2={lesion.x + 11} y2={lesion.y + 11} />
          <line x1={lesion.x + 11} y1={lesion.y - 11} x2={lesion.x - 11} y2={lesion.y + 11} />
          <text className={styles.lesionLabel} x={lesion.x} y={lesion.y - 17} textAnchor="middle">
            {lesion.label}
          </text>
        </g>
      )}

      {/* ---- Colour key. The hemifield coding is load-bearing, so it is named. ---- */}
      <g transform="translate(20, 168)">
        <line className={styles.fibreLeftField} x1={0} y1={0} x2={22} y2={0} />
        <text className={styles.sideTick} x={28} y={4}>
          left field
        </text>
        <line className={styles.fibreRightField} x1={0} y1={16} x2={22} y2={16} />
        <text className={styles.sideTick} x={28} y={20}>
          right field
        </text>
      </g>

      {/* ---- Readouts ---- */}
      <text className={styles.caption} x={20} y={286}>
        {derived.fieldDefectLabel}
      </text>
      <DiagramText className={styles.caption} x={20} y={430} maxWidth={520}>
        acuity {derived.acuityLabel} · IOP {derived.intraocularPressureMmHg.toFixed(0)} mmHg · rod{' '}
        {(derived.rodDrive * 100).toFixed(0)}% · cone {(derived.coneDrive * 100).toFixed(0)}%
      </DiagramText>

      {(derived.intraocularPressureMmHg >= AQUEOUS.GLAUCOMA_IOP_MMHG ||
        derived.rapdPositive ||
        derived.anisocoriaMm > 1.5 ||
        derived.nightBlindness) && (
        <text className={styles.alarm} x={440} y={286} textAnchor="end">
          {derived.intraocularPressureMmHg >= AQUEOUS.CRISIS_IOP_MMHG
            ? `acute angle closure — IOP ${derived.intraocularPressureMmHg.toFixed(0)}`
            : derived.intraocularPressureMmHg >= AQUEOUS.GLAUCOMA_IOP_MMHG
              ? `raised pressure — IOP ${derived.intraocularPressureMmHg.toFixed(0)}`
              : derived.rapdPositive
                ? 'swinging-torch positive — afferent defect'
                : derived.anisocoriaMm > 1.5
                  ? `anisocoria ${derived.anisocoriaMm.toFixed(1)} mm — efferent`
                  : 'night blindness — rods cannot carry it'}
        </text>
      )}

      <DiagramText className={styles.verdict} x={20} y={126} maxWidth={116} fontSize={13} tracking={0.04}>
        {derived.classification}
      </DiagramText>
    </DiagramFrame>
  );
}
