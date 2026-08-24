import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { LiverDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface LiverDiagramProps {
  derived: LiverDerived;
}

const POOL_MAX = 400;

/** The bilirubin pathway drawn left to right — blood pool (unconjugated), hepatocyte
 * (conjugation), bile duct, gut — with pool levels drawn to scale and the blockage marked. */
export function LiverDiagram({ derived }: LiverDiagramProps) {
  const uncHeight = (clamp(derived.unconjugatedUmolL, 0, POOL_MAX) / POOL_MAX) * 110;
  const conjHeight = (clamp(derived.conjugatedUmolL, 0, POOL_MAX) / POOL_MAX) * 110;
  const stoolWidth = clamp(derived.stoolColourPct, 0, 100);

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="Bilirubin pathway with pools and flow">
      {/* Blood pool: unconjugated. */}
      <rect x={50} y={90} width={70} height={120} fill="none" stroke="var(--text-dim)" rx={8} />
      <rect className={styles.bloodPool} x={54} y={206 - uncHeight} width={62} height={uncHeight} rx={6} />
      <text className={styles.label} x={46} y={78}>
        BLOOD · UNCONJUGATED
      </text>
      <text className={styles.caption} x={52} y={228}>
        {derived.unconjugatedUmolL.toFixed(0)} µmol/L
      </text>

      {/* Flow into liver */}
      <path className={styles.pathwayFlow} d={`M 122 150 H 168`} opacity={0.9} />
      <text className={styles.caption} x={118} y={140}>
        uptake
      </text>

      {/* Hepatocyte: conjugation + excretion capacity. */}
      <ellipse cx={230} cy={150} rx={58} ry={44} className={styles.organOutline} />
      <rect className={styles.bilePool} x={196} y={162 - conjHeight / 2.2} width={68} height={conjHeight / 1.1} rx={6} opacity={0.85} />
      <text className={styles.label} x={192} y={96}>
        LIVER · UGT {(derived.albuminGPerL > 0 ? '' : '')}
      </text>
      <text className={styles.caption} x={188} y={210}>
        conj {derived.conjugatedUmolL.toFixed(0)} µmol/L
      </text>
      <text className={styles.caption} x={186} y={224}>
        ALT ×{derived.altXUlN.toFixed(1)} · ALP ×{derived.alpXUlN.toFixed(1)} · R{' '}
        {derived.rFactor >= 60 ? '≥60' : derived.rFactor.toFixed(1)}
      </text>

      {/* Duct: blocked marker when obstructed. */}
      <path className={styles.pathwayFlow} d="M 290 150 H 356" opacity={(1 - derived.effectiveObstructionPct / 130).toFixed(2)} />
      <text className={styles.caption} x={292} y={140}>
        bile duct
      </text>
      {derived.effectiveObstructionPct > 20 && (
        <>
          <line className={styles.blockedDuct} x1={312} y1={136} x2={332} y2={164} />
          <text className={styles.alarm} x={300} y={126}>
            OBSTRUCTED {derived.effectiveObstructionPct.toFixed(0)}%
          </text>
        </>
      )}

      {/* Gut: pigment arriving → stool colour + urobilinogen. */}
      <rect x={360} y={112} width={160} height={76} rx={12} className={styles.organOutline} />
      <rect
        x={366}
        y={182}
        width={(148 * stoolWidth) / 100}
        height={0}
        rx={3}
        fill="none"
      />
      <rect
        x={366}
        y={176}
        width={(148 * stoolWidth) / 100}
        height={6}
        rx={3}
        fill="color-mix(in srgb, #7a5a1e 80%, transparent)"
        style={{ transition: 'width 0.3s ease' }}
      />
      <DiagramText className={styles.label} x={368} y={104} maxWidth={192}>
        GUT → STOOL & UROBILINOGEN
      </DiagramText>
      <DiagramText className={styles.caption} x={40} y={246} maxWidth={504}>
        {`stool colour ${derived.stoolColourPct.toFixed(0)}% · urobilinogen ${derived.urineUrobilinogenIndex.toFixed(0)}% of normal`}
      </DiagramText>

      <DiagramText className={styles.caption} x={40} y={262} maxWidth={504}>
        {`total ${derived.totalBilirubinUmolL.toFixed(0)} µmol/L (${derived.fractionConjugatedPct.toFixed(0)}% conjugated)${
          derived.jaundiceVisible ? ' · JAUNDICE VISIBLE' : ''
        }`}
      </DiagramText>
      <DiagramText className={styles.caption} x={40} y={296} maxWidth={504}>
        {`urine: bilirubin ${derived.urineBilirubinPresent ? 'PRESENT' : 'absent'} · ammonia ${derived.ammoniaUmolL.toFixed(0)} µmol/L${
          derived.encephalopathyGrade > 0 ? ` · encephalopathy grade ${derived.encephalopathyGrade}` : ''
        }`}
      </DiagramText>
      {derived.kernicterusRiskPct > 30 && (
        <DiagramText className={styles.alarm} x={40} y={330} maxWidth={504} fontSize={12}>
          {`Kernicterus risk ${derived.kernicterusRiskPct.toFixed(0)}% — unconjugated vs albumin binding`}
        </DiagramText>
      )}

      <DiagramText className={styles.verdict} x={40} y={364} maxWidth={504} fontSize={15} tracking={0.04}>
        {derived.classification}
      </DiagramText>
      <DiagramText
        className={styles.label}
        x={40}
        y={386}
        maxWidth={504}
        fontSize={11}
        tracking={0.06}
      >
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
