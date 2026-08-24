import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { MedullaDerived, MedullaInputs } from '../engine/types';
import styles from './Diagram.module.css';

interface MedullaDiagramProps {
  derived: MedullaDerived;
  inputs: MedullaInputs;
}

/** Receptor-blockade meters (alpha vs beta), haemodynamics readout strip, and the
 * catecholamine secretion trace with paroxysms. */
export function AdrenalMedullaDiagram({ derived, inputs }: MedullaDiagramProps) {
  const BAR = (y: number) => ({ x: 320, y, width: 200, height: 18 });
  const alphaPct = clamp(inputs.alphaBlockadePct / 100, 0, 1);
  const betaPct = clamp(inputs.betaBlockadePct / 100, 0, 1);

  const naPct = clamp(derived.plasmaNa / 120, 0, 1);
  const adPct = clamp(derived.plasmaAd / 120, 0, 1);

  const unopposedDanger =
    betaPct > 0.4 && alphaPct < 0.25 && derived.mapMmHg > 160;

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="Receptor blockade meters and catecholamine-driven haemodynamics">
      {/* Catecholamine levels as vertical bars. */}
      <text className={styles.label} x={44} y={44}>
        PLASMA CATECHOLAMINES
      </text>
      {[
        { label: 'NA', value: naPct, text: derived.plasmaNa.toFixed(0), color: 'var(--adrenal-medulla)' },
        { label: 'AD', value: adPct, text: derived.plasmaAd.toFixed(0), color: 'var(--epinephrine)' },
      ].map((c, i) => (
        <g key={c.label}>
          <rect className={styles.receptorFrame} x={56 + i * 70} y={58} width={34} height={110} rx={5} />
          <rect
            className={styles.receptorBar}
            x={59 + i * 70}
            y={165 - c.value * 104}
            width={28}
            height={c.value * 104}
            fill={c.color}
            opacity={0.85}
          />
          <text className={styles.caption} x={54 + i * 70} y={186}>
            {c.label} {c.text}
          </text>
        </g>
      ))}
      <text className={styles.caption} x={210} y={92}>
        NA share of secretion {(inputs.noradrenalineFractionPct).toFixed(0)}%
      </text>

      {/* Blockade meters. */}
      <text className={styles.label} x={320} y={44}>
        RECEPTOR BLOCKADE
      </text>
      <text className={styles.caption} x={320} y={76}>
        α-blockade {inputs.alphaBlockadePct.toFixed(0)}%
      </text>
      <rect className={styles.receptorFrame} {...BAR(82)} rx={5} />
      <rect className={styles.receptorBar} x={320} y={82} width={200 * alphaPct} height={18} fill="var(--ok)" opacity={0.8} />
      <text className={styles.caption} x={320} y={126}>
        β-blockade {inputs.betaBlockadePct.toFixed(0)}%
      </text>
      <rect className={styles.receptorFrame} {...BAR(132)} rx={5} />
      <rect className={styles.receptorBar} x={320} y={132} width={200 * betaPct} height={18} fill="var(--o2)" opacity={0.8} />
      {unopposedDanger && (
        <text className={styles.alarm} x={320} y={170}>
          UNOPPOSED ALPHA — pressure rising
        </text>
      )}

      {/* Haemodynamics strip. */}
      <text className={styles.label} x={44} y={228}>
        HAEMODYNAMICS
      </text>
      <rect className={styles.receptorFrame} x={44} y={236} width={476} height={16} rx={4} />
      <rect
        className={styles.receptorBar}
        x={44}
        y={236}
        width={(clamp((derived.mapMmHg - 60) / 160, 0, 1) * 476)}
        height={16}
        fill={derived.mapMmHg > 150 ? 'var(--danger)' : 'var(--artery)'}
        opacity={0.85}
      />
      <text className={styles.caption} x={44} y={272}>
        MAP {derived.mapMmHg.toFixed(0)} mmHg · HR {derived.heartRateBpm.toFixed(0)} bpm · volume{' '}
        {derived.bloodVolumePct.toFixed(0)}% · orthostatic drop {derived.orthostaticDropMmHg.toFixed(0)} mmHg
      </text>

      {/* Triad. */}
      <text className={styles.caption} x={44} y={296}>
        triad: headache {derived.triadHeadache ? '✓' : '·'} · sweating {derived.triadSweating ? '✓' : '·'} · palpitations{' '}
        {derived.triadPalpitations ? '✓' : '·'} ({derived.triadCount}/3)
      </text>
      {derived.arrhythmiaRiskPct > 45 && (
        <text className={styles.alarm} x={44} y={314}>
          arrhythmia risk {derived.arrhythmiaRiskPct.toFixed(0)}%
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
