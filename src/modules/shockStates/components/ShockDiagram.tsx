import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { ShockDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface ShockDiagramProps {
  derived: ShockDerived;
}

/** Venous reservoir up the left, right heart, lungs, left heart, arteries down the right,
 * tissue along the bottom. Four lesions sit at four different points on this one loop. */
const LOOP = 'M 112 200 L 203 200 L 203 110 L 363 110 L 363 200 L 470 200 L 470 352 L 112 352 Z';

const TANK = { x: 86, y: 236, width: 52, height: 88 };

/**
 * The circulation as a circuit, which is what it is — but with each of the four failure sites
 * drawn as a different STRUCTURE rather than as four identical dots with different captions.
 *
 * - Volume is a reservoir with a level in it, so hypovolaemia is a tank running dry.
 * - The pump is a chamber with a wall whose vigour you can see.
 * - Resistance is the calibre of the arterial pipe, so vasodilatation is a pipe gone wide.
 * - Obstruction is a clamp on the pulmonary limb and a shell around the heart.
 *
 * The one number this module hangs on that the old drawing never showed: measured central
 * venous pressure against TRANSMURAL right atrial pressure. In tamponade the first is high and
 * the second is low, and the gap between them is the entire lesion — a heart that looks full
 * from outside and is empty inside. Both are now on the drawing, side by side.
 */
export function ShockDiagram({ derived }: ShockDiagramProps) {
  const transitSeconds = clamp(18 / Math.max(derived.cardiacOutputLPerMin, 0.4), 1.2, 26);

  const volumeFraction = clamp(derived.bloodVolumeMl / 5500, 0.02, 1);
  const pericardial = clamp(derived.pericardialPressureMmHg / 20, 0, 1);
  const obstruction = clamp((derived.pulmonaryVascularResistance - 1) / 6, 0, 1);
  // Wide pipe = low resistance. This is the one lesion that makes the circuit look healthier.
  const calibre = clamp(1 / Math.max(derived.systemicVascularResistance, 0.25), 0.4, 3);

  const style = {
    '--cvp-fill': clamp(derived.centralVenousPressureMmHg / 18, 0, 1),
    '--wedge-fill': clamp(derived.wedgePressureMmHg / 28, 0, 1),
    '--contractility': clamp(derived.contractility, 0.05, 2),
    '--calibre': calibre,
    '--pericardial': pericardial,
    '--obstruction': obstruction,
    '--transit-seconds': transitSeconds,
  } as CSSProperties;

  const fillHeight = TANK.height * volumeFraction;

  return (
    <DiagramFrame
      viewBox="0 0 560 440"
      ariaLabel="The circulation as a loop, with the four sites where shock arises drawn as four different structures"
    >
      <g style={style}>
        <path className={styles.vessel} d={LOOP} />

        {/* ---- The arterial limb, drawn at the calibre the resistance implies ---- */}
        <path className={styles.arterialLimb} d="M 470 206 L 470 346" />
        <text className={styles.anatomy} x={480} y={272}>
          Arteries
        </text>
        <text className={styles.value} x={480} y={288}>
          SVR {(derived.systemicVascularResistance * 100).toFixed(0)}%
        </text>

        {/* ---- The venous reservoir. Hypovolaemia is a level, not a label. ---- */}
        <rect className={styles.tank} x={TANK.x} y={TANK.y} width={TANK.width} height={TANK.height} rx={8} />
        <rect
          className={styles.tankFill}
          x={TANK.x + 3}
          y={TANK.y + TANK.height - fillHeight + 3}
          width={TANK.width - 6}
          height={Math.max(0, fillHeight - 6)}
          rx={5}
        />
        <text className={styles.anatomy} x={TANK.x + TANK.width / 2} y={TANK.y - 10} textAnchor="middle">
          Venous reservoir
        </text>
        <text className={styles.value} x={TANK.x + TANK.width / 2} y={TANK.y + TANK.height + 18} textAnchor="middle">
          {(derived.bloodVolumeMl / 1000).toFixed(1)} L
        </text>

        {/* ---- Right heart. Filling pressure shown twice, because the difference is tamponade. ---- */}
        <rect className={styles.rightHeart} x={170} y={168} width={66} height={64} rx={8} />
        <text className={styles.anatomy} x={203} y={152} textAnchor="middle">
          Right heart
        </text>
        <text className={styles.value} x={203} y={252} textAnchor="middle">
          CVP {derived.centralVenousPressureMmHg.toFixed(0)}
        </text>
        <text className={styles.valueFaint} x={203} y={266} textAnchor="middle">
          transmural {derived.transmuralRapMmHg.toFixed(0)}
        </text>

        {/* ---- Lungs, and the clamp that obstruction puts on them ---- */}
        <path className={styles.lungs} d="M 243 110 q 20 -30 40 0 q 20 30 40 0" />
        <text className={styles.anatomy} x={283} y={78} textAnchor="middle">
          Lungs
        </text>
        {obstruction > 0.05 && (
          <g className={styles.clamp}>
            <path d="M 330 96 L 330 124" />
            <path d="M 340 96 L 340 124" />
            <text className={styles.lesionLabel} x={352} y={116}>
              obstruction
            </text>
          </g>
        )}

        {/* ---- Left heart. The wall carries the contractility. ---- */}
        <rect className={styles.leftHeart} x={330} y={168} width={66} height={64} rx={8} />
        <text className={styles.anatomy} x={363} y={152} textAnchor="middle">
          Left heart
        </text>
        <text className={styles.value} x={363} y={252} textAnchor="middle">
          Wedge {derived.wedgePressureMmHg.toFixed(0)}
        </text>
        <text className={styles.valueFaint} x={363} y={266} textAnchor="middle">
          SV {derived.strokeVolumeMl.toFixed(0)} mL
        </text>

        {/* ---- Pericardium: a shell that squeezes both chambers from outside ---- */}
        {pericardial > 0.03 && (
          <>
            <rect className={styles.pericardium} x={158} y={160} width={250} height={84} rx={22} />
            <text className={styles.lesionLabel} x={283} y={138} textAnchor="middle">
              pericardial {derived.pericardialPressureMmHg.toFixed(0)} mmHg
            </text>
          </>
        )}

        {/* ---- Tissue: where the shock is actually happening ---- */}
        <rect className={styles.tissue} x={186} y={330} width={208} height={44} rx={8} />
        <text className={styles.anatomy} x={290} y={348} textAnchor="middle">
          Tissue
        </text>
        <text className={styles.value} x={290} y={364} textAnchor="middle">
          SvO₂ {derived.mixedVenousSaturationPercent.toFixed(0)}% · lactate{' '}
          {derived.lactateMmolL.toFixed(1)}
        </text>

        <circle className={styles.flowPip} r={4} style={{ offsetPath: `path("${LOOP}")` } as CSSProperties} />

        <text className={styles.caption} x={36} y={36}>
          Cardiac index {derived.cardiacIndex.toFixed(1)} · MAP{' '}
          {derived.meanArterialPressureMmHg.toFixed(0)} mmHg · O₂ delivery{' '}
          {derived.oxygenDeliveryMlPerMin.toFixed(0)} mL/min
        </text>
        {derived.isOxygenDebt && (
          <text className={styles.alarm} x={36} y={56}>
            oxygen debt — demand exceeds what the tissue can take
          </text>
        )}

        <text className={styles.verdict} x={36} y={400}>
          {derived.classification}
        </text>
        <DiagramText className={styles.label} x={36} y={420} maxWidth={500} fontSize={11} tracking={0.06}>
          {derived.patternSummary}
        </DiagramText>
      </g>
    </DiagramFrame>
  );
}
