import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { BASELINE } from '../engine/constants';
import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { ElectrolyteDerived } from '../engine/types';

interface CompartmentDiagramProps {
  derived: ElectrolyteDerived;
}

/**
 * Darrow-Yannet geometry: width is volume, height is tonicity. Every disorder in this module has
 * a distinctive shape here — a tall narrow ECF is dehydration, a short wide one is water
 * intoxication, and a purely isotonic loss changes width with no change in height at all.
 */
const DY = {
  originX: 30,
  baselineY: 208,
  pxPerLitre: 5.6,
  pxPerMOsm: 0.34,
  maxTotalWidth: 272,
  maxHeight: 112,
  minHeight: 22,
};
const NORMAL_OSMOLALITY = 285;

/** Each ion appears at its own threshold, so the extracellular cluster visibly thins and
 * thickens while the intracellular one barely changes — the point about how small the
 * extracellular pool is, made geometrically. */
const ECF_POTASSIUM_MARKS = [3, 3.6, 4.2, 4.8, 5.4, 6, 6.8];
const ICF_POTASSIUM_MARKS = [0.55, 0.7, 0.8, 0.88, 0.94, 0.98, 1, 1.02];

export function CompartmentDiagram({ derived }: CompartmentDiagramProps) {
  // Scale the compartments to fit whatever total body water currently is, so a grossly
  // overloaded patient still fits on screen without the geometry lying about proportions.
  const rawTotalWidth = derived.totalBodyWaterL * DY.pxPerLitre;
  const fit = Math.min(1, DY.maxTotalWidth / Math.max(rawTotalWidth, 1));
  const icfWidth = derived.icfVolumeL * DY.pxPerLitre * fit;
  const ecfWidth = derived.ecfVolumeL * DY.pxPerLitre * fit;
  const blockHeight = clamp(derived.effectiveOsmolality * DY.pxPerMOsm, DY.minHeight, DY.maxHeight);
  const blockTop = DY.baselineY - blockHeight;

  const baselineIcfWidth = (BASELINE.TOTAL_BODY_WATER_L - BASELINE.ECF_VOLUME_L) * DY.pxPerLitre;
  const baselineEcfWidth = BASELINE.ECF_VOLUME_L * DY.pxPerLitre;
  const baselineHeight = NORMAL_OSMOLALITY * DY.pxPerMOsm;

  // Positive shift = potassium moving into cells, so the arrow points toward the cell.
  const shift = derived.transcellularShiftMeqPerDay;
  const shiftMagnitude = clamp(Math.abs(shift) / 60, 0, 1);
  const arrowFromX = shift > 0 ? 330 : 352;
  const arrowToX = shift > 0 ? 350 : 328;

  const totalBodyPotassiumPct = (derived.totalBodyPotassiumMeq / BASELINE.EXCHANGEABLE_POTASSIUM_MEQ) * 100;
  const rateSign = derived.sodiumChangeRateMeqLPerDay >= 0 ? '+' : '';

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Darrow-Yannet diagram of the intracellular and extracellular fluid compartments, alongside a cell showing how potassium is distributed across its membrane"
      defs={
        <marker id="shift-arrowhead" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path className={styles.arrowHead} d="M0,0 L9,4.5 L0,9 Z" />
        </marker>
      }
    >
      <text className={styles.pathLabel} x={22} y={24}>
        Compartments — width = volume, height = tonicity
      </text>
      <text className={styles.valueLabel} x={116} y={46} textAnchor="start">
        Na+ {derived.serumSodiumMeqL.toFixed(1)} mEq/L
      </text>
      <text className={styles.pathLabel} x={22} y={46}>
        Serum
      </text>
      <text className={styles.pathLabel} x={22} y={62}>
        corrected {derived.correctedSodiumMeqL.toFixed(1)} · {rateSign}
        {derived.sodiumChangeRateMeqLPerDay.toFixed(1)}/day
      </text>
      <text className={styles.pathLabel} x={22} y={78}>
        {derived.effectiveOsmolality.toFixed(0)} mOsm · {derived.tonicity}
      </text>

      {/* Normal compartments, so any deviation reads as a change rather than an absolute. */}
      <rect
        className={styles.baselineOutline}
        x={DY.originX}
        y={DY.baselineY - baselineHeight}
        width={baselineIcfWidth}
        height={baselineHeight}
      />
      <rect
        className={styles.baselineOutline}
        x={DY.originX + baselineIcfWidth}
        y={DY.baselineY - baselineHeight}
        width={baselineEcfWidth}
        height={baselineHeight}
      />

      <rect className={styles.icfBlock} x={DY.originX} y={blockTop} width={icfWidth} height={blockHeight} />
      <rect className={styles.ecfBlock} x={DY.originX + icfWidth} y={blockTop} width={ecfWidth} height={blockHeight} />
      <line className={styles.axisLine} x1={DY.originX} y1={DY.baselineY} x2={DY.originX + DY.maxTotalWidth} y2={DY.baselineY} />

      <text className={styles.valueLabel} x={DY.originX + icfWidth / 2} y={DY.baselineY + 16}>
        ICF {derived.icfVolumeL.toFixed(1)} L
      </text>
      <text className={styles.valueLabel} x={DY.originX + icfWidth + ecfWidth / 2} y={DY.baselineY + 16}>
        ECF {derived.ecfVolumeL.toFixed(1)} L
      </text>
      <text className={styles.pathLabel} x={DY.originX} y={DY.baselineY + 32}>
        {derived.ecfVolumeStatus} · total body water {derived.totalBodyWaterL.toFixed(1)} L
      </text>

      {/* --- Urine, bottom left --- */}
      <path className={styles.urineDrop} d="M34,282 c0,-9 10,-16 10,-23 c0,7 10,14 10,23 a10,10 0 0 1 -20,0 z" />
      <text className={styles.pathLabel} x={62} y={278}>
        {derived.urineVolumeLPerDay.toFixed(1)} L/day at {derived.urineOsmolality.toFixed(0)} mOsm · CH2O{' '}
        {derived.freeWaterClearanceLPerDay.toFixed(2)} L/day
      </text>
      <text className={styles.pathLabel} x={62} y={294}>
        ADH {(derived.adhLevel * 100).toFixed(0)}% · aldosterone {derived.aldosteroneLevel.toFixed(2)}x · TTKG{' '}
        {derived.transtubularKGradient.toFixed(1)}
      </text>

      {/* --- Potassium: the serum column on the left, the cell on the right --- */}
      <text className={styles.pathLabel} x={308} y={38}>
        Serum
      </text>
      {ECF_POTASSIUM_MARKS.map((threshold, index) => (
        <circle
          key={`ecf-${threshold}`}
          className={styles.potassiumIon}
          style={{ '--visible': derived.serumPotassiumMeqL >= threshold ? 1 : 0 } as CSSProperties}
          cx={322}
          cy={54 + index * 13}
          r={3.6}
        />
      ))}
      <text className={styles.valueLabel} x={322} y={164}>
        K+ {derived.serumPotassiumMeqL.toFixed(2)}
      </text>

      <rect className={styles.cellBody} x={356} y={44} width={104} height={100} rx={12} />
      <text className={styles.pathLabel} x={362} y={38}>
        Cell — 98% of K+
      </text>
      {ICF_POTASSIUM_MARKS.map((threshold, index) => (
        <circle
          key={`icf-${threshold}`}
          className={styles.potassiumIon}
          style={{ '--visible': totalBodyPotassiumPct / 100 >= threshold ? 1 : 0 } as CSSProperties}
          cx={378 + (index % 4) * 22}
          cy={78 + Math.floor(index / 4) * 30}
          r={3.6}
        />
      ))}
      <text className={styles.valueLabel} x={408} y={136}>
        total body {totalBodyPotassiumPct.toFixed(0)}%
      </text>

      <line
        className={styles.shiftArrow}
        style={{ '--magnitude': shiftMagnitude } as CSSProperties}
        x1={arrowFromX}
        y1={186}
        x2={arrowToX}
        y2={186}
      />
      <text className={styles.pathLabel} x={300} y={204}>
        {Math.abs(shift) < 1 ? 'shift in balance' : `shift ${Math.abs(shift).toFixed(0)} mEq/day ${shift > 0 ? 'into cells' : 'out of cells'}`}
      </text>

      <text className={styles.riskBadge} style={{ '--risk': derived.demyelinationRisk } as CSSProperties} x={382} y={228}>
        Correcting too fast
      </text>
      <text className={styles.riskBadge} style={{ '--risk': derived.ecgRisk === 'normal' ? 0 : 1 } as CSSProperties} x={382} y={246}>
        {derived.ecgRisk}
      </text>
    </DiagramFrame>
  );
}
