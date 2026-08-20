import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { CascadeLadder } from './CascadeLadder';
import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { CoagDerived } from '../engine/types';

interface CoagulationDiagramProps {
  derived: CoagDerived;
}

/** Fibrin strands laid across the platelet plug — drawn at fixed offsets so the mesh appears
 * to thicken rather than jitter as the level rises. */
const FIBRIN_STRANDS = [
  'M-26,-8 L26,-2',
  'M-24,2 L24,8',
  'M-18,-12 L20,10',
  'M-20,10 L22,-10',
  'M-12,-14 L12,14',
];

export function CoagulationDiagram({ derived }: CoagulationDiagramProps) {
  const plugStyle = { '--plug': clamp(derived.plateletPlug, 0, 1) } as CSSProperties;
  const fibrinStyle = { '--fibrin-level': clamp(derived.fibrin, 0, 1) } as CSSProperties;
  const injuryStyle = { '--injury': clamp(derived.tissueFactorExposure, 0, 1) } as CSSProperties;

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Diagram of haemostasis: an injured vessel wall with a platelet plug and fibrin mesh forming, alongside the coagulation cascade showing the extrinsic and intrinsic limbs converging on thrombin"
    >
      {/* --- Injured vessel --- */}
      <text className={styles.organLabel} x={116} y={38}>
        Injured vessel
      </text>

      <rect className={styles.vesselLumen} x={30} y={62} width={172} height={62} rx={12} />
      <path className={styles.vesselWall} d="M30,62 L202,62" />
      {/* Lower wall, broken at the injury site. */}
      <path className={styles.vesselWall} d="M30,124 L96,124" />
      <path className={styles.vesselWall} d="M136,124 L202,124" />
      <g style={injuryStyle}>
        <path className={styles.injurySite} d="M96,124 L104,136 M116,136 L124,124" />
        <text className={styles.limbLabel} x={116} y={152} fill="var(--danger)">
          breach
        </text>
      </g>

      {/* Platelet plug sealing the breach, with the fibrin mesh forming across it. */}
      <g transform="translate(116, 118)">
        <ellipse className={styles.plateletPlug} style={plugStyle} cx={0} cy={0} rx={30} ry={16} />
        <g style={fibrinStyle}>
          {FIBRIN_STRANDS.map((d) => (
            <path key={d} className={styles.fibrinStrand} d={d} />
          ))}
        </g>
      </g>

      <text className={styles.valueLabel} x={30} y={182}>
        Plug {(derived.plateletPlug * 100).toFixed(0)}% · Fibrin {(derived.fibrin * 100).toFixed(0)}%
      </text>
      <text className={styles.valueLabel} x={30} y={198}>
        Clot strength {(derived.clotStrength * 100).toFixed(0)}%
      </text>
      <text className={derived.isBleeding ? styles.statusBleeding : styles.statusSealed} x={30} y={222}>
        {derived.isBleeding ? 'Bleeding' : derived.timeToClotSeconds > 0 ? `Sealed in ${derived.timeToClotSeconds.toFixed(0)}s` : 'Intact'}
      </text>

      <CascadeLadder x={330} y={68} derived={derived} />
    </DiagramFrame>
  );
}
