import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { VesselFlow } from '@/shared/components/VesselFlow/VesselFlow';
import { clamp, scaleClamped } from '@/shared/lib/math';
import { TUBULE } from '../engine/constants';
import styles from './Diagram.module.css';
import type { RenalTubularDerived } from '../engine/types';

interface NephronDiagramProps {
  derived: RenalTubularDerived;
}

/** Where each nephron station sits along the unrolled tubule path. The loop dips down into
 * the medulla and back up, so the y coordinates trace the real anatomical descent. */
const STATION_POSITIONS = [
  { x: 46, y: 84 }, // Bowman's capsule
  { x: 108, y: 84 }, // Proximal tubule
  { x: 170, y: 214 }, // Descending limb (deep in the medulla)
  { x: 232, y: 96 }, // Ascending limb (back up in the cortex)
  { x: 300, y: 96 }, // Distal tubule
  { x: 392, y: 226 }, // Collecting duct (down through the medulla again)
];

const TUBULE_PATH =
  'M46,84 L108,84 C140,84 152,120 170,214 C186,290 214,180 232,96 L300,96 C340,96 358,110 366,150 L366,246';

export function NephronDiagram({ derived }: NephronDiagramProps) {
  const medullaStyle = { '--gradient-strength': derived.medullaryGradientStrength } as CSSProperties;
  const aquaporinStyle = { '--adh-action': derived.effectiveADHAction } as CSSProperties;
  const urineFlowSpeed = clamp(derived.urineFlowRateMLPerMin / 6, 0.1, 3);

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Diagram of an unrolled nephron showing tubular fluid osmolality at each segment from Bowman's capsule through the proximal tubule, loop of Henle, distal tubule and collecting duct, against the medullary osmotic gradient"
    >
      {/* Medullary gradient: bands deepen toward the papilla. */}
      <g style={medullaStyle}>
        <rect className={styles.medullaBand} x={0} y={130} width={480} height={56} />
        <rect className={styles.medullaBand} x={0} y={186} width={480} height={56} />
        <rect className={styles.medullaBand} x={0} y={242} width={480} height={58} />
      </g>
      <line className={styles.cortexDivider} x1={0} y1={130} x2={480} y2={130} />
      <text className={styles.medullaLabel} x={8} y={124}>
        Cortex
      </text>
      <text className={styles.medullaLabel} x={8} y={148}>
        Medulla — gradient {(derived.medullaryGradientStrength * 100).toFixed(0)}%
      </text>

      <path className={styles.tubuleSegment} d={TUBULE_PATH} />

      {derived.segments.map((segment, index) => {
        const position = STATION_POSITIONS[index];
        if (!position) return null;
        // Marker colour runs from tubule blue (dilute) to medulla amber (concentrated).
        const osmIntensity = scaleClamped(segment.osmolality, TUBULE.CD_MIN_URINE_OSMOLALITY, TUBULE.DESCENDING_MAX_OSMOLALITY, 0, 1);
        const markerStyle = { '--osm-intensity': osmIntensity } as CSSProperties;
        const labelAbove = index !== 2 && index !== 5;

        return (
          <g key={segment.label} transform={`translate(${position.x}, ${position.y})`} style={markerStyle}>
            <circle className={styles.osmolalityMarker} r={7} />
            <text className={styles.osmolalityValue} y={labelAbove ? -13 : 20}>
              {segment.osmolality.toFixed(0)}
            </text>
            <text className={styles.segmentLabel} y={labelAbove ? -24 : 31}>
              {segment.label}
            </text>
          </g>
        );
      })}

      {/* Aquaporin water exit from the collecting duct — visible only when ADH is acting. */}
      <g style={aquaporinStyle}>
        <path className={styles.aquaporinArrow} d="M372,176 L392,172" markerEnd="url(#adh-water-arrow)" />
        <path className={styles.aquaporinArrow} d="M372,204 L392,200" markerEnd="url(#adh-water-arrow)" />
        <path className={styles.aquaporinArrow} d="M372,232 L392,228" markerEnd="url(#adh-water-arrow)" />
        <text className={styles.pathLabel} x={398} y={196} fill="var(--adh)" opacity={derived.effectiveADHAction}>
          H2O
        </text>
      </g>

      <VesselFlow path="M366,252 L366,286" speed={urineFlowSpeed} colorVar="var(--urine)" />
      <text className={styles.pathLabel} x={286} y={286}>
        urine {derived.urineFlowRateMLPerMin.toFixed(1)} mL/min
      </text>

      <text className={styles.pathLabel} x={330} y={64} fill="var(--adh)">
        ADH {(derived.effectiveADHAction * 100).toFixed(0)}%
      </text>

      <defs>
        <marker id="adh-water-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--adh)" />
        </marker>
      </defs>
    </DiagramFrame>
  );
}
