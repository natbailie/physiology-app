import { useMemo } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import type { PregnancyDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface PregnancyDiagramProps {
  derived: PregnancyDerived;
}

const PLOT = { x: 320, y: 56, width: 210, height: 150 };
const MAX_WEEKS = 42;
const MAX_HB = 15;
const MIN_HB = 9;

const toX = (weeks: number) => PLOT.x + (clamp(weeks, 4, MAX_WEEKS) / MAX_WEEKS) * PLOT.width;
const toY = (hb: number) =>
  PLOT.y + PLOT.height - ((clamp(hb, MIN_HB, MAX_HB) - MIN_HB) / (MAX_HB - MIN_HB)) * PLOT.height;

/** Maternal Hb dilution curve across gestation with the operating point, the fetus drawn
 * to its current size, and the labour contraction trace when the Ferguson reflex runs. */
export function PregnancyDiagram({ derived }: PregnancyDiagramProps) {
  const hbCurve = useMemo(() => {
    // The dilution curve for a baseline Hb of 13.5: plasma outpaces red cells.
    const points: string[] = [];
    for (let w = 4; w <= MAX_WEEKS; w += 1) {
      const t = (w - 4) / 34;
      const progress = t * t * (3 - 2 * t) * 0.9 + t * 0.1;
      const pvInc = 45 * progress;
      const rcmInc = 25 * progress;
      const hb = 13.5 * (1 + rcmInc / 100) / (1 + pvInc / 100);
      points.push(`${w === 4 ? 'M' : 'L'}${toX(w).toFixed(1)},${toY(hb).toFixed(1)}`);
    }
    return points.join(' ');
  }, []);

  const fetusRadius = 8 + (clamp(derived.fetalWeightG, 0, 4000) / 4000) * 26;

  return (
    <DiagramFrame viewBox="0 0 560 400" ariaLabel="Maternal haemoglobin dilution curve, fetal growth and contractions">
      {/* Haemoglobin-vs-gestation curve with operating point. */}
      <rect className={styles.axis} x={PLOT.x} y={PLOT.y} width={PLOT.width} height={PLOT.height} fill="none" />
      <path className={styles.hbCurve} d={hbCurve} />
      <circle className={styles.operatingPoint} cx={toX(derived.pregnancyProgressFraction * 38 + 4)} cy={toY(derived.haemoglobinGPerDl)} r={5} />
      <text className={styles.label} x={PLOT.x} y={PLOT.y - 12}>
        Maternal Hb vs gestation
      </text>
      <text className={styles.caption} x={PLOT.x + 6} y={PLOT.y + 16}>
        {derived.haemoglobinGPerDl.toFixed(1)} g/dL — dilutional trough
      </text>
      <text className={styles.caption} x={PLOT.x} y={PLOT.y + PLOT.height + 16}>
        weeks →
      </text>

      {/* Uterus with fetus scaled by estimated weight. */}
      <ellipse cx={140} cy={130} rx={78} ry={92} className={styles.wombOutline} />
      <circle className={styles.fetusCircle} cx={140} cy={126} r={fetusRadius} />
      <text className={styles.label} x={86} y={24}>
        Fetus · {derived.fetalWeightG.toFixed(0)} g
      </text>
      <text className={styles.caption} x={80} y={238}>
        placental flow {derived.uteroplacentalFlowSharePct.toFixed(0)}% of CO
      </text>

      {/* Contraction trace during labour. */}
      <line className={styles.axis} x1={40} x2={280} y1={300} y2={300} />
      <text className={styles.label} x={40} y={282}>
        Contractions
      </text>
      {derived.cervicalDilationCm > 0 ? (
        <path
          className={styles.contractionWave}
          d={`M40,300 ${[0, 1, 2]
            .map(
              (i) =>
                `q 20 -${18 + i * 8} 40 0 q 14 -10 28 0`,
            )
            .join(' ')}`}
        />
      ) : (
        <line className={styles.axis} x1={40} x2={280} y1={300} y2={300} />
      )}
      {derived.cervicalDilationCm > 0 && (
        <text className={styles.alarm} x={180} y={316}>
          cervix {derived.cervicalDilationCm.toFixed(1)} cm · oxytocin{' '}
          {derived.oxytocinRelative.toFixed(0)}
        </text>
      )}

      <text className={styles.caption} x={40} y={344}>
        CO +{derived.cardiacOutputIncreasePct.toFixed(0)}% · SVR {derived.svrChangePct >= 0 ? '+' : ''}
        {derived.svrChangePct.toFixed(0)}% · MAP {derived.meanArterialPressureMmHg.toFixed(0)} · PaCO2{' '}
        {derived.paCO2MmHg.toFixed(0)} · creat {derived.creatinineMgDl.toFixed(2)}
      </text>
      <text className={styles.caption} x={40} y={360}>
        progesterone {derived.progesteroneNgMl.toFixed(0)} · prolactin {derived.prolactinNgMl.toFixed(0)} ng/mL · milk{' '}
        {derived.milkSupplyMlPerDay.toFixed(0)} mL/day
      </text>

      <text className={styles.verdict} x={40} y={380}>
        {derived.classification}
      </text>
    </DiagramFrame>
  );
}
