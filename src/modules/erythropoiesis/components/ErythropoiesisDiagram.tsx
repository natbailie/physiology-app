import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import { KIDNEY_PATH } from '@/shared/diagram/organShapes';
import { clamp, scaleClamped } from '@/shared/lib/math';
import { HEMOGLOBIN, SUBSTRATE } from '../engine/constants';
import styles from './Diagram.module.css';
import type { ErythroDerived } from '../engine/types';

interface ErythropoiesisDiagramProps {
  derived: ErythroDerived;
}

const MARROW_PATH = 'M-34,-20 C-14,-30 16,-30 34,-20 C40,-4 40,10 34,22 C14,32 -14,32 -34,22 C-40,10 -40,-4 -34,-20 Z';

const EPO_PATH = 'M330,150 C270,168 200,168 148,152';
const OXYGEN_FEEDBACK_PATH = 'M150,236 C226,266 314,232 348,196';

/** Circulating cells, positioned along the vessel. Radius tracks MCV so micro- and
 * macrocytosis are directly visible rather than only reported as a number. */
const CELL_POSITIONS = [
  { cx: 96, cy: 236 },
  { cx: 140, cy: 244 },
  { cx: 184, cy: 240 },
  { cx: 228, cy: 246 },
  { cx: 272, cy: 240 },
];

export function ErythropoiesisDiagram({ derived }: ErythropoiesisDiagramProps) {
  const kidneyStyle = {
    '--epo-level': clamp(derived.epoLevel, 0, 1),
    '--renal-function': clamp(derived.renalFunction, 0, 1),
  } as CSSProperties;

  const marrowStyle = {
    '--marrow-output': clamp(derived.marrowOutput, 0, 1),
    '--marrow-function': clamp(derived.marrowFunction, 0, 1),
  } as CSSProperties;

  const hbLevel = clamp(derived.hemoglobinGDl / HEMOGLOBIN.NORMAL_G_DL, 0.15, 1.4);
  const cellStyle = { '--hb-level': hbLevel } as CSSProperties;
  // MCV maps to the drawn radius, so a microcytic population is visibly smaller.
  const cellRadius = scaleClamped(derived.mcv, SUBSTRATE.MIN_MCV_FL, SUBSTRATE.MAX_MCV_FL, 5, 12);

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Diagram of erythropoiesis: the kidney sensing tissue oxygen and releasing erythropoietin, the bone marrow producing red cells, and those cells carrying oxygen back to the tissues"
      defs={
        <marker id="epo-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--epo)" />
        </marker>
      }
    >
      {/* Kidney: the oxygen sensor and EPO source. */}
      <g transform="translate(372, 132)" style={kidneyStyle}>
        <path className={styles.kidneyShape} d={KIDNEY_PATH} />
        <text className={styles.organLabel} y={62}>
          Kidney
        </text>
        <text className={styles.pathLabel} x={-22} y={76}>
          O2 sensor
        </text>
      </g>

      <HormoneArrow
        path={EPO_PATH}
        activation={clamp(derived.epoLevel, 0, 1)}
        colorVar="var(--epo)"
        label="EPO"
        markerId="epo-arrow"
        labelPos={{ x: 236, y: 142 }}
      />

      {/* Bone marrow: where the signal is answered — or is not. */}
      <g transform="translate(96, 120)" style={marrowStyle}>
        <path className={styles.marrowShape} d={MARROW_PATH} />
        <path className={styles.marrowCapacity} d={MARROW_PATH} />
        <text className={styles.organLabel} y={52}>
          Marrow
        </text>
      </g>

      {/* Circulating red cells. */}
      <path className={styles.vesselFlow} d="M78,240 L296,240" />
      <g style={cellStyle}>
        {CELL_POSITIONS.map((pos) => (
          <circle key={pos.cx} className={styles.redCell} cx={pos.cx} cy={pos.cy} r={cellRadius} />
        ))}
      </g>
      <text className={styles.pathLabel} x={78} y={270}>
        MCV {derived.mcv.toFixed(0)} fL
      </text>

      {/* Oxygen delivery closing the loop back to the renal sensor. */}
      <HormoneArrow
        path={OXYGEN_FEEDBACK_PATH}
        activation={clamp(1 - derived.tissueHypoxia, 0, 1)}
        colorVar="var(--o2)"
        label="O2 delivery"
        markerId="epo-arrow"
        labelPos={{ x: 210, y: 288 }}
        inhibitory
      />

      <text className={styles.classBadge} x={22} y={38}>
        {derived.anemiaClassification}
      </text>
      <text className={styles.valueLabel} x={22} y={56}>
        Hb {derived.hemoglobinGDl.toFixed(1)} g/dL · Hct {derived.hematocritPercent.toFixed(0)}%
      </text>
      <text className={styles.valueLabel} x={22} y={72}>
        EPO {(derived.epoLevel * 100).toFixed(0)}% · retic index {derived.reticulocyteIndex.toFixed(2)}
      </text>
      <text className={derived.isHypoproliferative ? styles.responseInadequate : styles.responseAdequate} x={22} y={90}>
        {derived.isHypoproliferative ? 'Marrow response inadequate' : 'Marrow response adequate'}
      </text>
    </DiagramFrame>
  );
}
