import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { CoagDerived } from '../engine/types';

interface CascadeLadderProps {
  x: number;
  y: number;
  derived: CoagDerived;
}

interface NodeSpec {
  key: string;
  label: string;
  cx: number;
  cy: number;
  /** How activated this node currently is, 0..1 */
  level: (d: CoagDerived) => number;
  colorVar: string;
}

/**
 * The cascade as a ladder: two limbs converging on a shared common pathway. Node brightness
 * tracks activation, so which limb is carrying the reaction — and where a deficiency has
 * broken it — is visible at a glance.
 */
const NODES: NodeSpec[] = [
  // Extrinsic limb (PT).
  { key: 'tf', label: 'TF·VIIa', cx: -46, cy: 0, level: (d) => d.tissueFactorExposure, colorVar: 'var(--artery)' },
  // Intrinsic limb (APTT).
  {
    key: 'viii',
    label: 'VIIIa·IXa',
    cx: 46,
    cy: 0,
    // Shows ACTIVATION, not merely available factor: the tenase complex only assembles once
    // thrombin has begun amplifying it, so like the extrinsic node it stays dark until injury.
    // Its brightness therefore reads as "how much this limb is contributing right now".
    level: (d) => clamp((d.factorVIIIActivity / 100) * (d.factorIXActivity / 100) * clamp(d.thrombin * 2, 0, 1), 0, 1),
    colorVar: 'var(--o2)',
  },
  // Common pathway.
  { key: 'xa', label: 'Xa', cx: 0, cy: 40, level: (d) => d.factorXa, colorVar: 'var(--platelet)' },
  { key: 'iia', label: 'Thrombin', cx: 0, cy: 76, level: (d) => d.thrombin, colorVar: 'var(--thrombin)' },
  { key: 'fibrin', label: 'Fibrin', cx: 0, cy: 112, level: (d) => d.fibrin, colorVar: 'var(--fibrin)' },
];

export function CascadeLadder({ x, y, derived }: CascadeLadderProps) {
  const thrombin = clamp(derived.thrombin, 0, 1);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <text className={styles.limbLabel} x={-46} y={-25}>
        Extrinsic
      </text>
      <text className={styles.limbLabel} x={-46} y={-13} fill="var(--text-faint)">
        (PT)
      </text>
      <text className={styles.limbLabel} x={46} y={-25}>
        Intrinsic
      </text>
      <text className={styles.limbLabel} x={46} y={-13} fill="var(--text-faint)">
        (APTT)
      </text>

      {/* Both limbs converge on factor Xa. */}
      <path className={derived.factorXa > 0.1 ? styles.cascadeArrowActive : styles.cascadeArrow} d="M-46,10 L-6,32" />
      <path className={derived.factorXa > 0.1 ? styles.cascadeArrowActive : styles.cascadeArrow} d="M46,10 L6,32" />
      <path className={derived.thrombin > 0.1 ? styles.cascadeArrowActive : styles.cascadeArrow} d="M0,50 L0,66" />
      <path className={derived.fibrin > 0.1 ? styles.cascadeArrowActive : styles.cascadeArrow} d="M0,86 L0,102" />

      {/* Thrombin's positive feedback onto the upstream cofactors. */}
      <path
        className={styles.feedbackArc}
        style={{ '--thrombin-level': thrombin } as React.CSSProperties}
        d="M12,76 C56,64 62,26 52,10"
      />
      <text className={styles.limbLabel} x={74} y={48} fill="var(--thrombin)" opacity={0.35 + thrombin * 0.65}>
        amplify
      </text>

      {NODES.map((node) => {
        const level = clamp(node.level(derived), 0, 1);
        return (
          <g key={node.key}>
            <circle
              className={styles.cascadeNode}
              cx={node.cx}
              cy={node.cy}
              r={13}
              stroke={node.colorVar}
              fill={`color-mix(in srgb, ${node.colorVar} ${(12 + level * 70).toFixed(0)}%, transparent)`}
              style={{ filter: `drop-shadow(0 0 calc(${(level * 7).toFixed(1)}px * var(--glow-blur)) color-mix(in srgb, ${node.colorVar} var(--glow-mix), transparent))` }}
            />
            <text className={styles.nodeLabel} x={node.cx} y={node.cy + 26}>
              {node.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
