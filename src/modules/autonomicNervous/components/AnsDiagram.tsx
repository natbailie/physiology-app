import { OrganEffectors } from './OrganEffectors';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { AnsDerived } from '../engine/types';

interface AnsDiagramProps {
  derived: AnsDerived;
}

const MESSENGER_BAR_WIDTH = 76;

/** A labeled bar showing a second messenger's current level. */
function MessengerBar({ x, y, label, level }: { x: number; y: number; label: string; level: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <text className={styles.pathLabel} x={0} y={-6}>
        {label}
      </text>
      <rect className={styles.messengerBar} x={0} y={0} width={MESSENGER_BAR_WIDTH} height={7} rx={3.5} />
      <rect className={styles.messengerFill} x={0} y={0} width={MESSENGER_BAR_WIDTH * clamp(level, 0, 1)} height={7} rx={3.5} />
    </g>
  );
}

export function AnsDiagram({ derived }: AnsDiagramProps) {
  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Diagram of autonomic control across five organ effectors — heart, bronchi, pupil, gut and glands — each tinted by whether sympathetic or parasympathetic activity currently dominates it, alongside the cAMP and IP3 second-messenger levels"
    >
      <path className={styles.spinalCord} d="M240,36 L240,270" />

      <text className={styles.pathLabel} x={16} y={22} fill="var(--sympathetic)">
        Sympathetic
      </text>
      <text className={styles.pathLabel} x={378} y={22} fill="var(--parasympathetic)">
        Parasympathetic
      </text>

      <OrganEffectors derived={derived} />

      <MessengerBar x={40} y={278} label="cAMP (Gs / beta)" level={derived.campLevel} />
      <MessengerBar x={330} y={278} label="IP3 / Ca (Gq)" level={derived.ip3CalciumLevel} />
    </DiagramFrame>
  );
}
