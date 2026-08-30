import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { InflammationDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface InflammationDiagramProps {
  derived: InflammationDerived;
}

const TISSUE = { x: 40, y: 80, w: 200, h: 160 };
const BAR = { x: 300, y: 90, width: 104, height: 160 };
const BAR_MAX = 2;

/**
 * A tissue cross-section showing the inflammatory site: immune cells arriving, pus
 * collecting, and insult particles at the centre — beside a bar chart of the cell
 * populations driving the response.
 */
export function InflammationDiagram({ derived }: InflammationDiagramProps) {
  const midX = TISSUE.x + TISSUE.w / 2;
  const midY = TISSUE.y + TISSUE.h / 2;

  const toBarH = (v: number) => (clamp(v, 0, BAR_MAX) / BAR_MAX) * BAR.height;

  const neutH = toBarH(derived.neutrophilPopulation);
  const monoH = toBarH(derived.monocyteMacrophageActivity);
  const pusH = toBarH(derived.pusBurden);

  // Insult representation: circle radius proportional to load.
  const insultR = clamp(derived.insultLoad * 18, 2, 36);

  // Cell counts inside the tissue (capped for readability).
  const neutCount = Math.round(clamp(derived.neutrophilPopulation * 6, 0, 12));
  const monoCount = Math.round(clamp(derived.monocyteMacrophageActivity * 4, 0, 8));

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="Inflammatory site and immune cell populations">
      {/* Tissue cross-section */}
      <text className={styles.label} x={TISSUE.x} y={TISSUE.y - 12}>
        Tissue site
      </text>
      <rect
        className={styles.tissue}
        x={TISSUE.x}
        y={TISSUE.y}
        width={TISSUE.w}
        height={TISSUE.h}
        rx={6}
      />

      {/* Insult at centre */}
      {derived.insultType === 'bacterial' && (
        <circle
          className={styles.insultBacteria}
          cx={midX}
          cy={midY}
          r={insultR}
        />
      )}
      {derived.insultType === 'sterileCrystal' && (
        <g>
          {[...Array(5)].map((_, i) => (
            <polygon
              key={i}
              className={styles.insultCrystal}
              points={`${midX + (i - 2) * 10},${midY - 8} ${midX + (i - 2) * 10 + 5},${midY + 4} ${midX + (i - 2) * 10 - 5},${midY + 4}`}
            />
          ))}
        </g>
      )}
      {derived.insultType === 'foreignBody' && (
        <rect
          className={styles.insultForeign}
          x={midX - insultR * 0.8}
          y={midY - 4}
          width={insultR * 1.6}
          height={8}
          rx={2}
        />
      )}

      {/* Immune cells scattered around the insult */}
      {[...Array(neutCount)].map((_, i) => {
        const angle = (i / Math.max(neutCount, 1)) * Math.PI * 2 + 0.3;
        const dist = 40 + (i % 3) * 15;
        return (
          <circle
            key={`n${i}`}
            className={styles.neutrophilDot}
            cx={midX + Math.cos(angle) * dist}
            cy={midY + Math.sin(angle) * dist}
            r={3}
          />
        );
      })}
      {[...Array(monoCount)].map((_, i) => {
        const angle = (i / Math.max(monoCount, 1)) * Math.PI * 2 + 1.8;
        const dist = 50 + (i % 3) * 12;
        return (
          <circle
            key={`m${i}`}
            className={styles.macrophageDot}
            cx={midX + Math.cos(angle) * dist}
            cy={midY + Math.sin(angle) * dist}
            r={4}
          />
        );
      })}

      {/* Pus pool */}
      {derived.pusBurden > 0.1 && (
        <ellipse
          className={styles.pusPool}
          cx={midX}
          cy={midY + 30}
          rx={clamp(derived.pusBurden * 25, 5, 60)}
          ry={clamp(derived.pusBurden * 12, 3, 30)}
        />
      )}

      {/* Cell labels */}
      <text className={styles.caption} x={TISSUE.x + 4} y={TISSUE.y + TISSUE.h + 18}>
        ● neutrophils · ● macrophages
      </text>

      {/* Immune cell bar chart */}
      <text className={styles.label} x={BAR.x - 10} y={BAR.y - 24}>
        Cells & pus
      </text>
      <rect className={styles.neutBar} x={BAR.x} y={BAR.y + BAR.height - neutH} width={BAR.width * 0.3} height={neutH} />
      <rect className={styles.monoBar} x={BAR.x + BAR.width * 0.35} y={BAR.y + BAR.height - monoH} width={BAR.width * 0.3} height={monoH} />
      <rect className={styles.pusBar} x={BAR.x + BAR.width * 0.7} y={BAR.y + BAR.height - pusH} width={BAR.width * 0.3} height={pusH} />
      <line className={styles.axis} x1={BAR.x - 4} x2={BAR.x + BAR.width + 4} y1={BAR.y + BAR.height} y2={BAR.y + BAR.height} />
      <text className={styles.tickLabel} x={BAR.x + BAR.width * 0.15} y={BAR.y + BAR.height + 16}>
        neut
      </text>
      <text className={styles.tickLabel} x={BAR.x + BAR.width * 0.5} y={BAR.y + BAR.height + 16}>
        mono
      </text>
      <text className={styles.tickLabel} x={BAR.x + BAR.width * 0.85} y={BAR.y + BAR.height + 16}>
        pus
      </text>

      {/* Summary lines */}
      <text className={styles.caption} x={40} y={310}>
        load {derived.insultLoad.toFixed(2)} · CRP {derived.crpMgL.toFixed(0)} mg/L · temp{' '}
        {derived.coreTemperatureC.toFixed(1)} °C
      </text>
      <text className={styles.caption} x={40} y={328}>
        neutrophils {derived.neutrophilCount10e9PerL.toFixed(1)} ×10⁹/L · chronic{' '}
        {(derived.chronicInflammationIndex * 100).toFixed(0)}%
      </text>
      {derived.sirsActive && (
        <text className={styles.alarm} x={40} y={350}>
          SIRS — systemic inflammatory response
        </text>
      )}

      <text className={styles.verdict} x={40} y={380}>
        {derived.classification}
      </text>
      <DiagramText className={styles.label} x={40} y={400} maxWidth={504} fontSize={11} tracking={0.06}>
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
