import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { AdrenalCortexInputs, AdrenalCortexDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface AdrenalCortexDiagramProps {
  derived: AdrenalCortexDerived;
  inputs: AdrenalCortexInputs;
}

/** The steroidogenic line drawn left to right with each enzyme node coloured by block
 * severity, and flux bars for the three zone outputs. */
export function AdrenalCortexDiagram({ derived, inputs }: AdrenalCortexDiagramProps) {
  const enzymes: Array<{ name: string; block: number; x: number }> = [
    { name: '3β-HSD', block: inputs.block3bhsdPct, x: 96 },
    { name: '17α', block: inputs.block17Pct, x: 176 },
    { name: '21-OH', block: inputs.block21Pct, x: 256 },
    { name: '11β', block: inputs.block11Pct, x: 336 },
  ];

  const BAR = (y: number) => ({ x: 330, y, width: 190, height: 16 });
  const cortisolPct = clamp(derived.effectiveCortisol / 150, 0, 1);
  const mcPct = clamp(derived.mineralocorticoidActivity / 200, 0, 1);
  const androPct = clamp(derived.androgens / 300, 0, 1);

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="Steroidogenesis pathway with enzyme blocks and zone output fluxes">
      {/* Pathway spine with enzyme nodes. */}
      <text className={styles.label} x={40} y={44}>
        Steroidogenic pathway · ACTH ×{(derived.acthEffectivePct / 100).toFixed(1)}
      </text>
      <path className={styles.pathwayLine} d="M 52 84 H 428" />
      {enzymes.map((e) => (
        <g key={e.name}>
          <rect
            className={e.block >= 50 ? styles.enzymeBlocked : styles.enzymeNode}
            x={e.x}
            y={68}
            width={62}
            height={32}
            rx={6}
          />
          <text className={styles.caption} x={e.x + (e.name.length > 4 ? 8 : 14)} y={88}>
            {e.name} {e.block >= 5 ? `${e.block.toFixed(0)}%` : ''}
          </text>
        </g>
      ))}

      {/* Branch outputs. */}
      <text className={styles.label} x={44} y={132}>
        Zone outputs (relative to normal)
      </text>

      {[
        { label: 'Cortisol (ZF)', value: cortisolPct, text: derived.effectiveCortisol.toFixed(0), y: 158, color: 'var(--cortisol)' },
        { label: 'Aldosterone + DOC (ZG)', value: mcPct, text: derived.mineralocorticoidActivity.toFixed(0), y: 196, color: 'var(--raas)' },
        { label: 'Androgens (ZR)', value: androPct, text: derived.androgens.toFixed(0), y: 234, color: 'var(--lh)' },
      ].map((row) => (
        <g key={row.label}>
          <text className={styles.caption} x={44} y={row.y - 4}>
            {row.label} · {row.text}
          </text>
          <rect className={styles.fluxFrame} {...BAR(row.y)} rx={4} />
          <rect className={styles.fluxBar} x={330} y={row.y} width={190 * row.value} height={16} fill={row.color} opacity={0.85} />
        </g>
      ))}

      <text className={styles.caption} x={44} y={292}>
        17-OHP marker {derived.marker17ohp.toFixed(0)} · DOC excess {derived.docExcess.toFixed(0)}
      </text>
      {(derived.saltWasting || derived.hypertensionFromDoc || derived.addisonianCrisisRiskPct > 50) && (
        <text className={styles.alarm} x={44} y={312}>
          {derived.saltWasting
            ? 'Salt-wasting — mineralocorticoid collapse'
            : derived.addisonianCrisisRiskPct > 50
              ? `Crisis risk ${derived.addisonianCrisisRiskPct.toFixed(0)}% — cortisol insufficient`
              : 'DOC-driven hypertension'}
        </text>
      )}

      <text className={styles.verdict} x={44} y={352}>
        {derived.classification}
      </text>
      <DiagramText
        className={styles.caption}
        x={44}
        y={374}
        maxWidth={500}
        fontSize={11}
        tracking={0.06}
      >
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
