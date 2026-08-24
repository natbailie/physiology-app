import { useMemo } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import { CRANIUM } from '../engine/constants';
import { intracranialPressure } from '../engine/cerebralMechanics';
import type { CerebralDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface CerebralDiagramProps {
  derived: CerebralDerived;
}

const PLOT = { x: 300, y: 60, width: 230, height: 170 };
const MAX_VOLUME_ML = 160;
const MAX_PRESSURE_MMHG = 70;

const toX = (volumeMl: number) => PLOT.x + (clamp(volumeMl, 0, MAX_VOLUME_ML) / MAX_VOLUME_ML) * PLOT.width;
const toY = (pressureMmHg: number) =>
  PLOT.y + PLOT.height - (clamp(pressureMmHg, 0, MAX_PRESSURE_MMHG) / MAX_PRESSURE_MMHG) * PLOT.height;

/** The skull drawn as a fixed box whose contents must sum to the same width, and the
 * pressure-volume curve beside it with the current operating point marked. */
export function CerebralDiagram({ derived }: CerebralDiagramProps) {
  const curve = useMemo(() => {
    const points: string[] = [];
    for (let v = 0; v <= MAX_VOLUME_ML; v += 4) {
      points.push(`${v === 0 ? 'M' : 'L'}${toX(v).toFixed(1)},${toY(intracranialPressure(v)).toFixed(1)}`);
    }
    return points.join(' ');
  }, []);

  const kneeX = toX(CRANIUM.COMPENSATORY_RESERVE_ML);

  // Contents drawn to scale inside a box of fixed width.
  const BOX = { x: 40, y: 90, width: 210, height: 74 };
  const totalMl = 1400;
  const scale = BOX.width / totalMl;
  const massWidth = derived.massVolumeMl * scale * 4;
  const bloodWidth = derived.cerebralBloodVolumeMl * scale * 4;
  const csfWidth = Math.max(0, 140 + derived.csfExcessMl) * scale * 4;
  const brainWidth = Math.max(20, BOX.width - massWidth - bloodWidth - csfWidth);

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="Intracranial contents and the pressure-volume curve">
      <path className={styles.skull} d={`M ${BOX.x - 8} ${BOX.y - 10} h ${BOX.width + 16} v ${BOX.height + 20} h -${BOX.width + 16} z`} />
      <text className={styles.label} x={BOX.x - 8} y={BOX.y - 18}>
        A BOX THAT CANNOT EXPAND
      </text>

      <rect className={styles.brainBlock} x={BOX.x} y={BOX.y} width={brainWidth} height={BOX.height} />
      <rect className={styles.bloodBlock} x={BOX.x + brainWidth} y={BOX.y} width={bloodWidth} height={BOX.height} />
      <rect
        className={styles.csfBlock}
        x={BOX.x + brainWidth + bloodWidth}
        y={BOX.y}
        width={csfWidth}
        height={BOX.height}
      />
      <rect
        className={styles.massBlock}
        x={BOX.x + brainWidth + bloodWidth + csfWidth}
        y={BOX.y}
        width={massWidth}
        height={BOX.height}
      />
      <text className={styles.label} x={BOX.x} y={BOX.y + BOX.height + 30}>
        BRAIN · BLOOD · CSF · MASS
      </text>

      {/* Pressure-volume curve: flat while there is reserve, then exponential. */}
      <rect className={styles.reserveZone} x={PLOT.x} y={PLOT.y} width={kneeX - PLOT.x} height={PLOT.height} />
      <rect
        className={styles.steepZone}
        x={kneeX}
        y={PLOT.y}
        width={PLOT.x + PLOT.width - kneeX}
        height={PLOT.height}
      />
      <line className={styles.axis} x1={PLOT.x} x2={PLOT.x + PLOT.width} y1={PLOT.y + PLOT.height} y2={PLOT.y + PLOT.height} />
      <line className={styles.axis} x1={PLOT.x} x2={PLOT.x} y1={PLOT.y} y2={PLOT.y + PLOT.height} />
      <path className={styles.curve} d={curve} />
      <circle
        className={styles.operatingPoint}
        cx={toX(derived.totalExcessVolumeMl)}
        cy={toY(derived.intracranialPressureMmHg)}
        r={5}
      />
      <text className={styles.label} x={PLOT.x} y={PLOT.y - 12}>
        PRESSURE vs VOLUME
      </text>
      <text className={styles.label} x={PLOT.x} y={PLOT.y + PLOT.height + 18}>
        added volume →
      </text>

      <text className={styles.caption} x={40} y={300}>
        ICP {derived.intracranialPressureMmHg.toFixed(0)} · CPP{' '}
        {derived.cerebralPerfusionPressureMmHg.toFixed(0)} · CBF {derived.cerebralBloodFlow.toFixed(0)} ·{' '}
        {derived.compensatoryReserveMl.toFixed(0)} mL reserve
      </text>
      <text className={styles.caption} x={40} y={318}>
        one more mL costs {derived.elastanceMmHgPerMl.toFixed(2)} mmHg
      </text>
      {derived.cushingResponseActive && (
        <text className={styles.alarm} x={40} y={338}>
          Cushing response — hypertension with bradycardia at {derived.reflexHeartRateBpm.toFixed(0)} bpm
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
