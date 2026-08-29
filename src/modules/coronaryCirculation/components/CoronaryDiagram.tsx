import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { CoronaryDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface CoronaryDiagramProps {
  derived: CoronaryDerived;
}

/** Left ventricle in short-axis cross-section: cavity, then the two layers of wall. */
const HEART = { cx: 150, cy: 212, epi: 88, endo: 67, cavity: 46 };
/** The epicardial artery runs on the outside of the muscle, which is the whole point of it. */
const ARTERY_R = 100;

const RAD = Math.PI / 180;
const onCircle = (degrees: number, radius: number) => ({
  x: HEART.cx + radius * Math.cos(degrees * RAD),
  y: HEART.cy + radius * Math.sin(degrees * RAD),
});

/** An arc of the epicardial vessel between two angles, drawn the short way round. */
function arteryArc(fromDeg: number, toDeg: number): string {
  const a = onCircle(fromDeg, ARTERY_R);
  const b = onCircle(toDeg, ARTERY_R);
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} A ${ARTERY_R} ${ARTERY_R} 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
}

/** Where the lesion sits on the vessel. Everything downstream of it shares its supply. */
const LESION_FROM = 250;
const LESION_TO = 290;

/** Intramural branches diving from the epicardial vessel through the wall to the endocardium.
 * These are the vessels that wall tension squeezes shut in systole. */
const PENETRATORS = [210, 230, 270, 310, 330];

const CYCLE = { x: 300, y: 96, width: 240, height: 16 };

/**
 * The coronary circulation drawn as the anatomy that produces the physiology.
 *
 * Three things the old box-and-bars version asserted in text and can now be seen:
 *
 * 1. The artery is EPICARDIAL — it runs on the outside — and its branches must dive through the
 *    full thickness of contracting muscle to reach the endocardium. That is why the innermost
 *    layer is the one that starves, and the engine already distinguishes subendocardial
 *    ischaemia from transmural injury; the wall is now drawn in the two layers that
 *    distinction refers to.
 * 2. Perfusion happens in diastole. The cycle bar shows how much of each beat that is, so
 *    tachycardia visibly eats the window rather than merely changing a percentage.
 * 3. The driving head is diastolic pressure MINUS the ventricular pressure the subendocardium
 *    sits in, so both ends of the subtraction are on the drawing.
 *
 * The supply-versus-demand bars that used to occupy the right half have gone to the charts,
 * where the same two quantities were already being traced over time on the same axis.
 */
export function CoronaryDiagram({ derived }: CoronaryDiagramProps) {
  const lumenFraction = clamp(1 - derived.stenosisEffectiveFraction, 0.02, 1);
  const diastoleWidth = CYCLE.width * clamp(derived.diastolicTimeFraction, 0.05, 0.95);
  const systoleWidth = CYCLE.width - diastoleWidth;

  const endoClass = derived.anginaActive || derived.transmuralInjuryActive ? styles.endoIschaemic : styles.endoLayer;
  const epiClass = derived.transmuralInjuryActive ? styles.epiInjured : styles.epiLayer;

  const lesionMid = onCircle((LESION_FROM + LESION_TO) / 2, ARTERY_R);

  return (
    <DiagramFrame
      viewBox="0 0 560 440"
      ariaLabel="Left ventricle in cross-section with its epicardial artery, the lesion, and the two layers of wall it supplies"
    >
      {/* ---- The ventricular wall, in its two layers ---- */}
      <circle className={epiClass} cx={HEART.cx} cy={HEART.cy} r={HEART.epi} />
      <circle className={endoClass} cx={HEART.cx} cy={HEART.cy} r={HEART.endo} />
      <circle className={styles.cavity} cx={HEART.cx} cy={HEART.cy} r={HEART.cavity} />

      <text className={styles.chamberLabel} x={HEART.cx} y={HEART.cy - 2}>
        LV
      </text>
      <text className={styles.cavityPressure} x={HEART.cx} y={HEART.cy + 16}>
        {derived.leftVentricularEndDiastolicPressureMmHg.toFixed(0)} mmHg
      </text>

      {/* ---- Intramural branches, then the epicardial vessel on top of them ---- */}
      {PENETRATORS.map((angle) => {
        const outer = onCircle(angle, ARTERY_R - 4);
        const inner = onCircle(angle, HEART.cavity + 4);
        const downstream = angle > LESION_FROM && angle < LESION_TO;
        return (
          <path
            key={angle}
            className={downstream ? styles.penetratorDownstream : styles.penetrator}
            style={{ '--lumen': lumenFraction } as React.CSSProperties}
            d={`M ${outer.x.toFixed(1)} ${outer.y.toFixed(1)} L ${inner.x.toFixed(1)} ${inner.y.toFixed(1)}`}
          />
        );
      })}

      <path className={styles.arteryWall} d={arteryArc(200, 340)} />
      <path className={styles.arteryLumen} d={arteryArc(200, LESION_FROM)} />
      <path className={styles.arteryLumen} d={arteryArc(LESION_TO, 340)} />
      {/* The narrowed segment: the lumen stroke thins in proportion to the residual lumen. */}
      <path
        className={styles.arteryLumen}
        style={{ strokeWidth: Math.max(0.6, 8 * lumenFraction) }}
        d={arteryArc(LESION_FROM, LESION_TO)}
      />

      {derived.collateralFraction > 0.08 && (
        <>
          <path
            className={styles.collateralPath}
            style={{ opacity: 0.2 + derived.collateralFraction * 0.6 }}
            d="M 119.9 121.9 Q 150 60 180.1 121.9"
          />
          <text className={styles.anatomy} x={150} y={56} textAnchor="middle">
            collaterals
          </text>
        </>
      )}

      <text className={styles.anatomy} x={lesionMid.x} y={lesionMid.y - 14} textAnchor="middle">
        lesion · {(lumenFraction * 100).toFixed(0)}% lumen
      </text>

      <path className={styles.leader} d="M 96 132 L 74 162" />
      <text className={styles.anatomy} x={30} y={128}>
        Epicardial artery
      </text>

      {/* ---- Key to the two layers. Colour is carrying the ischaemia here, so it is named. ---- */}
      <rect className={epiClass} x={30} y={330} width={12} height={12} rx={2} />
      <text className={styles.anatomy} x={50} y={340}>
        Subepicardium — outer wall
      </text>
      <rect className={endoClass} x={30} y={352} width={12} height={12} rx={2} />
      <text className={styles.anatomy} x={50} y={362}>
        Subendocardium — perfused last, in diastole only
      </text>

      {/* ---- The diastolic window. Perfusion of the wall happens here and nowhere else. ---- */}
      <text className={styles.label} x={CYCLE.x} y={CYCLE.y - 12}>
        ONE CARDIAC CYCLE
      </text>
      <rect className={styles.systoleBlock} x={CYCLE.x} y={CYCLE.y} width={systoleWidth} height={CYCLE.height} rx={3} />
      <rect
        className={styles.diastoleBlock}
        x={CYCLE.x + systoleWidth}
        y={CYCLE.y}
        width={diastoleWidth}
        height={CYCLE.height}
        rx={3}
      />
      <text className={styles.tickLabel} x={CYCLE.x + systoleWidth / 2} y={CYCLE.y + CYCLE.height + 14}>
        systole
      </text>
      <text className={styles.tickLabel} x={CYCLE.x + systoleWidth + diastoleWidth / 2} y={CYCLE.y + CYCLE.height + 14}>
        diastole
      </text>
      <text className={styles.anatomyFaint} x={CYCLE.x + systoleWidth + diastoleWidth / 2} y={CYCLE.y + CYCLE.height + 30} textAnchor="middle">
        the wall is perfused here
      </text>
      <text className={styles.caption} x={CYCLE.x} y={CYCLE.y + CYCLE.height + 52}>
        {derived.effectiveHeartRateBpm.toFixed(0)} bpm · diastole{' '}
        {(derived.diastolicTimeFraction * 100).toFixed(0)}% of the cycle
      </text>

      {/* ---- The subtraction that sets the driving head ---- */}
      <text className={styles.label} x={CYCLE.x} y={214}>
        PERFUSION HEAD
      </text>
      <text className={styles.caption} x={CYCLE.x} y={234}>
        aortic diastolic {derived.effectiveDiastolicPressureMmHg.toFixed(0)}
      </text>
      <text className={styles.caption} x={CYCLE.x} y={250}>
        − ventricular {derived.leftVentricularEndDiastolicPressureMmHg.toFixed(0)}
      </text>
      <line className={styles.axis} x1={CYCLE.x} x2={CYCLE.x + 150} y1={258} y2={258} />
      <text className={styles.headline} x={CYCLE.x} y={278}>
        {derived.drivingPressureMmHg.toFixed(0)} mmHg
      </text>

      <text className={styles.caption} x={CYCLE.x} y={310}>
        reserve ×{derived.flowReserveRatio.toFixed(1)} · demand ×{derived.requiredFlow.toFixed(2)} · carriage{' '}
        {(derived.oxygenCarriageRatio * 100).toFixed(0)}%
      </text>

      {/* ---- Consequence ---- */}
      {derived.anginaActive && (
        <text className={styles.alarm} x={300} y={340}>
          angina — supply short of demand by {(derived.ischaemiaLevel * 100).toFixed(0)}%
        </text>
      )}
      {derived.transmuralInjuryActive && (
        <text className={styles.alarm} x={300} y={358}>
          vessel occluded — full wall thickness at risk
        </text>
      )}

      <text className={styles.verdict} x={30} y={396}>
        {derived.classification}
      </text>
      <DiagramText className={styles.label} x={30} y={418} maxWidth={500} fontSize={11} tracking={0.06}>
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
