import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { MECHANISM_LABELS } from '../engine/edemaClassification';
import { clamp, scaleClamped } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { CapillaryDerived } from '../engine/types';

interface CapillaryDiagramProps {
  derived: CapillaryDerived;
}

const CAPILLARY = { left: 62, right: 396, y: 92, height: 20 };
const TISSUE = { left: 62, right: 396, top: 158, baselineHeight: 34 };
/** Five stations along the capillary. Net pressure is evaluated at each, so the point where
 * filtration turns into reabsorption can be seen rather than asserted. */
const STATIONS = [0.08, 0.29, 0.5, 0.71, 0.92];
const MAX_ARROW_PX = 34;

export function CapillaryDiagram({ derived }: CapillaryDiagramProps) {
  const span = CAPILLARY.right - CAPILLARY.left;
  const oedema = derived.oedemaSeverity;
  const tissueHeight = TISSUE.baselineHeight * clamp(1 + derived.interstitialExcess * 0.7, 0.6, 2.6);
  const reserveWidth = derived.lymphaticReserveFraction * 64;

  // Pressure falls linearly along the capillary, so the net Starling pressure at each station
  // follows from the same equation evaluated at the local hydrostatic pressure.
  const stationPressures = STATIONS.map((fraction) => {
    const local = derived.arteriolarEndPressure + (derived.venularEndPressure - derived.arteriolarEndPressure) * fraction;
    return derived.arteriolarNetPressure + (local - derived.arteriolarEndPressure);
  });
  const scale = Math.max(4, Math.max(...stationPressures.map(Math.abs)));

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="A capillary with the four Starling forces acting across its wall, the tissue it supplies swelling as fluid accumulates, and the lymphatic vessel draining it"
      defs={
        <>
          <marker id="flux-arrowhead" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path className={styles.arrowHeadOut} d="M0,0 L8,4 L0,8 Z" />
          </marker>
          <marker id="flux-arrowhead-in" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path className={styles.arrowHeadIn} d="M0,0 L8,4 L0,8 Z" />
          </marker>
        </>
      }
    >
      <text className={styles.pathLabel} x={22} y={22}>
        {derived.tissueBed} capillary — Jv = Kf [(Pc − Pi) − s(pic − pii)]
      </text>

      {/* The two halves of the equation, each shown as its total. Grouping them this way keeps
          the signs honest: a NEGATIVE interstitial pressure is an outward force, not an inward
          one, and it belongs in the hydrostatic total rather than beside the oncotic term. */}
      <text className={`${styles.pathLabel} ${styles.forceOut}`} x={22} y={44}>
        out: Pc {derived.capillaryPressureMmHg.toFixed(1)} − Pi {derived.interstitialPressureMmHg.toFixed(1)} ={' '}
        {(derived.capillaryPressureMmHg - derived.interstitialPressureMmHg).toFixed(1)}
      </text>
      <text className={`${styles.pathLabel} ${styles.forceIn}`} x={22} y={58}>
        in: s {derived.reflectionCoefficient.toFixed(2)} x (pic {derived.plasmaOncoticMmHg.toFixed(1)} − pii{' '}
        {derived.interstitialOncoticMmHg.toFixed(1)}) ={' '}
        {(derived.reflectionCoefficient * (derived.plasmaOncoticMmHg - derived.interstitialOncoticMmHg)).toFixed(1)}
      </text>
      <text className={styles.valueLabel} x={368} y={44} textAnchor="end">
        NFP {derived.netFiltrationPressure >= 0 ? '+' : ''}
        {derived.netFiltrationPressure.toFixed(2)} mmHg
      </text>
      <text className={styles.pathLabel} x={286} y={58}>
        Jv {derived.filtrationRateMlPerMin.toFixed(2)} mL/min
      </text>

      {/* Feeding arteriole and draining venule. */}
      <path className={styles.feedVessel} d={`M20,${CAPILLARY.y + 10} L${CAPILLARY.left},${CAPILLARY.y + 10}`} />
      <path className={styles.drainVessel} d={`M${CAPILLARY.right},${CAPILLARY.y + 10} L${CAPILLARY.right + 40},${CAPILLARY.y + 10}`} />
      <text className={styles.pathLabel} x={16} y={CAPILLARY.y - 6}>
        {derived.arteriolarEndPressure.toFixed(0)}
      </text>
      <text className={styles.pathLabel} x={CAPILLARY.right + 10} y={CAPILLARY.y - 6}>
        {derived.venularEndPressure.toFixed(0)}
      </text>

      <rect
        className={styles.capillaryWall}
        x={CAPILLARY.left}
        y={CAPILLARY.y}
        width={span}
        height={CAPILLARY.height}
        rx={CAPILLARY.height / 2}
      />

      {/* Net flux at each station: pointing down means filtration, up means reabsorption. */}
      {STATIONS.map((fraction, index) => {
        const x = CAPILLARY.left + fraction * span;
        const pressure = stationPressures[index]!;
        const length = clamp((Math.abs(pressure) / scale) * MAX_ARROW_PX, 5, MAX_ARROW_PX);
        const filtering = pressure >= 0;
        return (
          <line
            key={fraction}
            className={filtering ? styles.fluxArrow : styles.fluxArrowIn}
            x1={x}
            y1={filtering ? CAPILLARY.y + CAPILLARY.height : CAPILLARY.y + CAPILLARY.height + length}
            x2={x}
            y2={filtering ? CAPILLARY.y + CAPILLARY.height + length : CAPILLARY.y + CAPILLARY.height}
          />
        );
      })}

      {/* The tissue, swelling as fluid accumulates. */}
      <rect
        className={styles.tissueBaseline}
        x={TISSUE.left}
        y={TISSUE.top}
        width={TISSUE.right - TISSUE.left}
        height={TISSUE.baselineHeight}
      />
      <rect
        className={styles.tissueBlock}
        style={{ '--oedema': oedema } as CSSProperties}
        x={TISSUE.left}
        y={TISSUE.top}
        width={TISSUE.right - TISSUE.left}
        height={tissueHeight}
        rx={5}
      />
      <text className={styles.valueLabel} x={(TISSUE.left + TISSUE.right) / 2} y={TISSUE.top + 20}>
        interstitium {derived.interstitialVolumeMl.toFixed(0)} mL ({derived.interstitialExcess >= 0 ? '+' : ''}
        {(derived.interstitialExcess * 100).toFixed(0)}%)
      </text>

      {/* Lymphatic drainage, with the reserve that has to run out before anything accumulates. */}
      <path className={styles.lymphVessel} d={`M${TISSUE.right},${TISSUE.top + 18} L${TISSUE.right + 34},${TISSUE.top - 24}`} />
      <text className={styles.pathLabel} x={404} y={TISSUE.top - 32}>
        lymph
      </text>
      <text className={styles.pathLabel} x={22} y={TISSUE.top + 74}>
        lymph {derived.lymphFlowMlPerMin.toFixed(2)} of {derived.lymphaticCapacityMlPerMin.toFixed(1)} mL/min
      </text>
      <rect className={styles.reserveTrack} x={22} y={TISSUE.top + 82} width={64} height={7} rx={3.5} />
      <rect
        className={derived.lymphaticReserveFraction <= 0.02 ? styles.reserveExhausted : styles.reserveFill}
        x={22}
        y={TISSUE.top + 82}
        width={Math.max(derived.lymphaticReserveFraction <= 0.02 ? 64 : reserveWidth, 1)}
        height={7}
        rx={3.5}
      />
      <text className={styles.pathLabel} x={94} y={TISSUE.top + 89}>
        {derived.lymphaticReserveFraction <= 0.02 ? 'reserve exhausted' : `${(derived.lymphaticReserveFraction * 100).toFixed(0)}% reserve`}
      </text>

      <text className={styles.pathLabel} x={22} y={TISSUE.top + 110}>
        safety factor {derived.safetyFactorMmHg.toFixed(1)} mmHg remaining
      </text>
      <text className={styles.mechanismBadge} x={22} y={TISSUE.top + 128}>
        {MECHANISM_LABELS[derived.dominantMechanism]}
      </text>

      <text className={styles.warningBadge} style={{ '--warn': derived.isPitting ? 1 : 0 } as CSSProperties} x={286} y={TISSUE.top + 110}>
        Free fluid — pitting
      </text>
      <text
        className={styles.warningBadge}
        style={{ '--warn': scaleClamped(derived.oxygenationImpairment, 0.1, 0.4, 0, 1) } as CSSProperties}
        x={286}
        y={TISSUE.top + 128}
      >
        Gas exchange impaired
      </text>
    </DiagramFrame>
  );
}
