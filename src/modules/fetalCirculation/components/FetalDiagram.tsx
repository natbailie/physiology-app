import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import { CLASSIFICATION } from '../engine/constants';
import type { FetalDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface FetalDiagramProps {
  derived: FetalDerived;
}

/**
 * Blood coloured by how oxygenated it is, on the usual blue-to-red convention.
 *
 * In a fetus nothing is purely arterial or venous — every vessel carries a mixture, and which
 * mixture ends up where IS the subject of the module. A two-colour scheme cannot say that; a
 * continuous one can, and it turns the pre-ductal/post-ductal difference into a visible colour
 * step across the duct rather than two numbers to be compared by hand.
 */
function bySaturation(percent: number): string {
  const p = clamp(percent, 0, 100);
  return `color-mix(in oklab, var(--artery) ${p.toFixed(0)}%, var(--venous))`;
}

/** Saturation probes read as they would at the cot side: pink above 88%, blue below. */
function probeClass(saturation: number): string | undefined {
  return saturation >= 88 ? styles.probeHigh : styles.probeLow;
}

/**
 * The fetal circulation, drawn so the anatomy carries the mechanism.
 *
 * Branch ORDER is the point of the layout. The brachiocephalic vessels leave the top of the
 * aortic arch; the ductus arteriosus joins the aorta beyond them, at the isthmus. Pre- and
 * post-ductal saturation are then a consequence of where on the drawing you stand, rather than
 * two labelled numbers to be taken on trust — and differential cyanosis becomes a colour step
 * you can see across the point where the duct inserts.
 *
 * Every structure the engine models is drawn, including the two it previously left out: the
 * liver with the ductus venosus bypassing it (which is why the stream aimed at the foramen is
 * the best-oxygenated blood in the body), and the umbilical vein that feeds it.
 *
 * The one crossing in the drawing is real: the pulmonary trunk's continuation into the duct
 * passes behind the ascending aorta. It is drawn with the aorta casing over it, the usual
 * convention for a vessel passing behind another.
 */
export function FetalDiagram({ derived }: FetalDiagramProps) {
  const ductalMagnitude = clamp(Math.abs(derived.ductalShuntFraction), 0, 1);
  const rightToLeft = derived.ductalShuntFraction > 0;

  const style = {
    '--placental': clamp(derived.placentalCirculation, 0.05, 1),
    '--inflation': clamp(derived.lungInflation, 0, 1),
    // Lung branches thicken as the pulmonary bed opens and the duct stops stealing the output.
    '--lung-flow': clamp(derived.pulmonaryFlowFraction, 0, 1),
    '--dv-open': clamp(derived.ductusVenosusPatency, 0, 1),
  } as CSSProperties;

  const ductStyle = {
    '--shunt-flow': ductalMagnitude,
    '--shunt-open': clamp(derived.ductusArteriosusPatency, 0, 1),
  } as CSSProperties;

  const foramenStyle = {
    '--shunt-flow': clamp(Math.abs(derived.atrialShuntFraction) * 2, 0, 1),
    '--shunt-open': clamp(derived.foramenOvalePatency, 0, 1),
  } as CSSProperties;

  const ductClass =
    derived.ductusArteriosusPatency < 0.12
      ? styles.closed
      : rightToLeft
        ? styles.shuntRightToLeft
        : styles.shuntLeftToRight;

  const foramenClass = derived.foramenOvalePatency < 0.12 ? styles.closed : styles.shuntRightToLeft;

  const source = derived.oxygenatedSourceSaturation;
  const pre = derived.preDuctalSaturationPercent;
  const post = derived.postDuctalSaturationPercent;

  // The aorta is drawn twice: a background-coloured casing, then the blood-coloured stroke on
  // top, so the duct passing behind it reads as behind rather than as a junction.
  const ASCENDING = 'M 294 256 L 318 256 L 318 126 Q 318 100 344 100 L 368 100';
  const DESCENDING = 'M 368 100 Q 394 100 394 126 L 394 330';

  return (
    <DiagramFrame
      viewBox="0 0 560 400"
      ariaLabel="Fetal circulation: the three shunts, and where pre- and post-ductal blood diverge"
    >
      <g style={style}>
        {/* ---- Lungs. Barely perfused and fluid-filled until the first breath. ---- */}
        <ellipse className={styles.lung} cx={74} cy={78} rx={26} ry={34} />
        <ellipse className={styles.lung} cx={124} cy={78} rx={26} ry={34} />
        <text className={styles.anatomyStrong} x={72} y={132}>
          Lungs
        </text>

        {/* ---- Upper body, fed from the arch BEFORE the duct joins ---- */}
        <rect className={styles.bodyBlock} x={206} y={22} width={210} height={42} rx={10} />
        <text className={styles.anatomyStrong} x={218} y={40}>
          Head &amp; right arm
        </text>
        <text className={styles.anatomy} x={218} y={55}>
          pre-ductal
        </text>
        <text className={probeClass(pre)} x={404} y={49} textAnchor="end">
          {pre.toFixed(0)}%
        </text>

        {/* ---- Heart. Right chambers on the patient's right, so the viewer's left. ---- */}
        <rect className={styles.rightSide} x={146} y={186} width={74} height={46} rx={7} />
        <text className={styles.chamberLabel} x={183} y={210}>
          RA
        </text>
        <text className={styles.pressure} x={183} y={225} textAnchor="middle">
          {derived.rightAtrialPressureMmHg.toFixed(0)} mmHg
        </text>

        <rect className={styles.leftSide} x={220} y={186} width={74} height={46} rx={7} />
        <text className={styles.chamberLabel} x={257} y={210}>
          LA
        </text>
        <text className={styles.pressure} x={257} y={225} textAnchor="middle">
          {derived.leftAtrialPressureMmHg.toFixed(0)} mmHg
        </text>

        <rect className={styles.rightSide} x={146} y={232} width={74} height={54} rx={7} />
        <text className={styles.chamberLabel} x={183} y={264}>
          RV
        </text>
        <rect className={styles.leftSide} x={220} y={232} width={74} height={54} rx={7} />
        <text className={styles.chamberLabel} x={257} y={264}>
          LV
        </text>

        {/* ---- Foramen ovale: a flap in the interatrial septum, held open only while the right
                atrium is at the higher pressure. Both pressures are on the drawing because they
                are the reason it shuts — functionally, at the first breath. ---- */}
        <path className={foramenClass} style={foramenStyle} d="M 210 208 L 230 208" markerEnd="url(#fetalArrow)" />
        <text className={styles.anatomy} x={220} y={168} textAnchor="middle">
          Foramen ovale
        </text>

        {/* ---- Pulmonary trunk, up the outside of the right heart. The duct is its
                continuation; the pulmonary arteries are the branch that peels off to the
                lung, and in utero they take almost nothing. ---- */}
        <path className={styles.pulmonary} d="M 146 256 Q 110 256 110 230 L 110 172 Q 110 156 130 156 L 200 156" />
        <text className={styles.anatomy} x={116} y={140}>
          Pulmonary trunk
        </text>
        <path className={styles.lungBranch} d="M 152 156 L 112 116" />

        {/* ---- Ductus arteriosus: joining the aorta at the isthmus, DISTAL to the head. ---- */}
        <path className={ductClass} style={ductStyle} d="M 200 156 Q 296 126 392 150" markerEnd="url(#fetalArrow)" />

        {/* ---- Aorta. Casing first so the duct reads as passing behind it. ---- */}
        <path className={styles.aortaCasing} d={ASCENDING} />
        <path className={styles.aortaCasing} d={DESCENDING} />
        <path className={styles.aorta} style={{ stroke: bySaturation(pre) }} d={ASCENDING} />
        <path className={styles.aorta} style={{ stroke: bySaturation(post) }} d={DESCENDING} />

        {/* Brachiocephalic: head and right arm, proximal to the duct. */}
        <path className={styles.aorta} style={{ stroke: bySaturation(pre) }} d="M 344 100 L 344 64" />
        <text className={styles.anatomy} x={310} y={92} textAnchor="end">
          Aortic arch
        </text>
        <text className={styles.anatomy} x={238} y={118}>
          Ductus arteriosus
        </text>
        <text className={styles.anatomy} x={404} y={200}>
          Descending
        </text>
        <text className={styles.anatomy} x={404} y={214}>
          aorta
        </text>

        {/* ---- Lower body, fed beyond the duct ---- */}
        <rect className={styles.bodyBlock} x={206} y={330} width={210} height={42} rx={10} />
        <text className={styles.anatomyStrong} x={218} y={348}>
          Lower body &amp; feet
        </text>
        <text className={styles.anatomy} x={218} y={363}>
          post-ductal
        </text>
        <text className={probeClass(post)} x={404} y={357} textAnchor="end">
          {post.toFixed(0)}%
        </text>

        {/* ---- Placenta, umbilical vessels, liver and the ductus venosus ---- */}
        <path className={styles.umbilicalArtery} style={{ stroke: bySaturation(post) }} d="M 206 352 L 86 352" />
        <text className={styles.anatomy} x={104} y={370}>
          Umbilical arteries
        </text>

        <circle className={styles.placenta} cx={52} cy={352} r={22} />
        <text className={styles.anatomyStrong} x={22} y={392}>
          Placenta
        </text>

        <path
          className={styles.umbilicalVein}
          style={{ stroke: bySaturation(source) }}
          d="M 52 330 L 52 312 L 84 312"
        />

        <rect className={styles.liver} x={84} y={300} width={50} height={24} rx={5} />
        <text className={styles.anatomy} x={92} y={316}>
          Liver
        </text>

        {/* The bypass around the liver. What takes it is the best-oxygenated blood in the
            body, and it is the stream aimed at the foramen ovale. */}
        <path
          className={styles.ductusVenosus}
          style={{ stroke: bySaturation(source) }}
          d="M 84 312 Q 112 278 140 292"
        />
        <text className={styles.anatomy} x={58} y={266}>
          Ductus venosus
        </text>
        <text className={probeClass(source)} x={80} y={296} textAnchor="end">
          {source.toFixed(0)}%
        </text>

        {/* IVC: the placental stream arriving at the right atrium, aimed at the foramen. */}
        <path className={styles.ivc} style={{ stroke: bySaturation(source) }} d="M 140 292 L 136 292 L 136 216 L 146 216" />

        {/* Pulmonary veins: what little the lungs return, into the left atrium. */}
        <path className={styles.pulmonaryVein} d="M 138 106 L 234 186" />

        {/* ---- Readings ---- */}
        <text className={styles.caption} x={206} y={14}>
          PVR {derived.pulmonaryVascularResistance.toFixed(1)} · SVR{' '}
          {derived.systemicVascularResistance.toFixed(2)} · lungs take{' '}
          {(derived.pulmonaryFlowFraction * 100).toFixed(0)}% of output
        </text>

        {/* ---- Right column: the verdict and the colour key ---- */}
        <DiagramText className={styles.verdict} x={424} y={244} maxWidth={124} fontSize={15} tracking={0.04}>
          {derived.phase}
        </DiagramText>
        {derived.saturationGradientPercent > CLASSIFICATION.DIFFERENTIAL_GAP_PERCENT && (
          <text className={styles.alarm} x={424} y={306}>
            differential cyanosis
          </text>
        )}
        <g transform="translate(424, 328)">
          <rect className={styles.legendBar} x={0} y={0} width={100} height={7} rx={3} />
          <text className={styles.tickLabel} x={0} y={20} textAnchor="start">
            less O₂
          </text>
          <text className={styles.tickLabel} x={100} y={20} textAnchor="end">
            more O₂
          </text>
        </g>
      </g>

      <defs>
        <marker
          id="fetalArrow"
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerWidth="9"
          markerHeight="9"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path className={styles.arrowHead} d="M 0 1 L 7 4 L 0 7 z" />
        </marker>
        <linearGradient id="fetalSatScale" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--venous)" />
          <stop offset="100%" stopColor="var(--artery)" />
        </linearGradient>
      </defs>
    </DiagramFrame>
  );
}
