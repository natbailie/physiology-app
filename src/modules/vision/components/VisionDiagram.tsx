import { useMemo } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import { absoluteSignal, nakaRushton, rodWeight } from '../engine/visionMechanics';
import { RECEPTOR } from '../engine/constants';
import type { VisionDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface VisionDiagramProps {
  derived: VisionDerived;
}

const PLOT = { x: 320, y: 60, width: 210, height: 170 };
const MIN_LOG = -6;
const MAX_LOG = 4.5;
const MAX_BRIGHTNESS = 100;

const toX = (logCd: number) => PLOT.x + ((clamp(logCd, MIN_LOG, MAX_LOG) - MIN_LOG) / (MAX_LOG - MIN_LOG)) * PLOT.width;
const toY = (brightness: number) =>
  PLOT.y + PLOT.height - (clamp(brightness, 0, MAX_BRIGHTNESS) / MAX_BRIGHTNESS) * PLOT.height;

/** Two eyes seen head-on with live pupil diameters, and the intensity-response curve with the
 * current operating point marked against the scotopic/mesopic/photopic bands. */
export function VisionDiagram({ derived }: VisionDiagramProps) {
  const curve = useMemo(() => {
    const points: string[] = [];
    for (let log = MIN_LOG; log <= MAX_LOG; log += 0.1) {
      const wRod = rodWeight(log);
      // A healthy pair of eyes at each luminance: what the curve would look like before disease.
      const response = nakaRushton(log, Math.min(log, RECEPTOR.ROD_ADAPTATION_CEILING_LOG_CD)) * wRod +
        nakaRushton(log, Math.max(log, RECEPTOR.CONE_ADAPTATION_FLOOR_LOG_CD)) * (1 - wRod);
      const blended = 0.35 * clamp(response, 0, 1) + 0.65 * absoluteSignal(log, 1, 1);
      points.push(`${log === MIN_LOG ? 'M' : 'L'}${toX(log).toFixed(1)},${toY(blended * 100).toFixed(1)}`);
    }
    return points.join(' ');
  }, []);

  const eyeR = { cx: 120, cy: 110 };
  const eyeL = { cx: 230, cy: 110 };

  const pupilRadiusR = derived.pupilRightMm * 5.5;
  const pupilRadiusL = derived.pupilLeftMm * 5.5;

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="Pupil reflexes and the retinal intensity-response curve">
      {/* The two eyes, pupils drawn to scale. */}
      <circle className={styles.eyeOutline} cx={eyeR.cx} cy={eyeR.cy} r={52} />
      <circle className={styles.eyeOutline} cx={eyeL.cx} cy={eyeL.cy} r={52} />
      <circle
        className={styles.iris}
        cx={eyeR.cx}
        cy={eyeR.cy}
        r={Math.max(pupilRadiusR + 4, 14)}
      />
      <circle
        className={styles.iris}
        cx={eyeL.cx}
        cy={eyeL.cy}
        r={Math.max(pupilRadiusL + 4, 14)}
      />
      <circle className={styles.pupil} cx={eyeR.cx} cy={eyeR.cy} r={pupilRadiusR} />
      <circle className={styles.pupil} cx={eyeL.cx} cy={eyeL.cy} r={pupilRadiusL} />
      <text className={styles.label} x={eyeR.cx - 30} y={eyeR.cy + 74}>
        RIGHT · {derived.pupilRightMm.toFixed(1)} mm
      </text>
      <text className={styles.label} x={eyeL.cx - 28} y={eyeL.cy + 74}>
        LEFT · {derived.pupilLeftMm.toFixed(1)} mm
      </text>

      {/* Torch beams when the swinging-torch test is running. */}
      {derived.directReflexRightScore > 2 && (
        <line className={styles.torchBeam} x1={20} y1={40} x2={eyeR.cx - 18} y2={eyeR.cy - 18} />
      )}
      {derived.directReflexLeftScore > 2 && (
        <line className={styles.torchBeam} x1={330} y1={40} x2={eyeL.cx + 18} y2={eyeL.cy - 18} />
      )}

      {/* Intensity-response curve with lighting-regime bands. */}
      <rect className={styles.zoneScotopic} x={toX(-6)} y={PLOT.y} width={toX(-3) - toX(-6)} height={PLOT.height} />
      <rect className={styles.zoneMesopic} x={toX(-3)} y={PLOT.y} width={toX(1) - toX(-3)} height={PLOT.height} />
      <rect className={styles.zonePhotopic} x={toX(1)} y={PLOT.y} width={toX(MAX_LOG) - toX(1)} height={PLOT.height} />
      <line className={styles.axis} x1={PLOT.x} x2={PLOT.x + PLOT.width} y1={PLOT.y + PLOT.height} y2={PLOT.y + PLOT.height} />
      <line className={styles.axis} x1={PLOT.x} x2={PLOT.x} y1={PLOT.y} y2={PLOT.y + PLOT.height} />
      <path className={styles.curve} d={curve} />
      <circle
        className={styles.operatingPoint}
        cx={toX(derived.effectiveLuminanceLogCd)}
        cy={toY(derived.perceivedBrightness)}
        r={5}
      />
      <text className={styles.label} x={PLOT.x} y={PLOT.y - 12}>
        SIGNAL vs SCENE LUMINANCE
      </text>
      <text className={styles.label} x={PLOT.x} y={PLOT.y + PLOT.height + 16}>
        log cd/m² →
      </text>
      <text className={styles.caption} x={toX(-6)} y={PLOT.y + 14}>
        scotopic
      </text>
      <text className={styles.caption} x={toX(-2.9)} y={PLOT.y + 14}>
        mesopic
      </text>
      <text className={styles.caption} x={toX(1.1)} y={PLOT.y + 14}>
        photopic
      </text>

      <text className={styles.caption} x={40} y={300}>
        acuity {derived.acuityLabel} · brightness {derived.perceivedBrightness.toFixed(0)}% · glutamate{' '}
        {(derived.glutamateRelease * 100).toFixed(0)}%
      </text>
      <text className={styles.caption} x={40} y={318}>
        rod drive {(derived.rodDrive * 100).toFixed(0)}% · cone drive {(derived.coneDrive * 100).toFixed(0)}%
      </text>
      {(derived.rapdPositive || derived.anisocoriaMm > 1.5 || derived.nightBlindness) && (
        <text className={styles.alarm} x={40} y={338}>
          {derived.rapdPositive
            ? 'Swinging-torch positive — relative afferent defect'
            : derived.anisocoriaMm > 1.5
              ? `Anisocoria ${derived.anisocoriaMm.toFixed(1)} mm — efferent failure`
              : 'Night blindness — rods cannot carry scotopic vision'}
        </text>
      )}

      <text className={styles.verdict} x={40} y={368}>
        {derived.classification}
      </text>
      <DiagramText
        className={styles.label}
        x={40}
        y={388}
        maxWidth={504}
        fontSize={11}
        tracking={0.06}
      >
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
