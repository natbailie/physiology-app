import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { ABO } from '../engine/constants';
import { aboMajorIncompatible } from '../engine/bloodMechanics';
import { clamp } from '@/shared/lib/math';
import type { BloodDerived, BloodInputs } from '../engine/types';
import styles from './Diagram.module.css';

interface BloodDiagramProps {
  derived: BloodDerived;
  inputs: BloodInputs;
}

/** The ABO compatibility matrix with the current pair highlighted, plus the two reaction
 * timelines (immediate IgM vs delayed IgG) with the current severity marked. */
export function BloodGroupsDiagram({ derived, inputs }: BloodDiagramProps) {
  const GRID = { x: 44, y: 66, cell: 52 };

  const severity = clamp(derived.haemolyticSeverity, 0, 100) / 100;
  const PLOT = { x: 330, y: 70, width: 200, height: 120 };
  // Both reaction arms drawn; opacity marks which one is live.
  const aboPath = `M${PLOT.x},${PLOT.y + PLOT.height} C ${PLOT.x + 40},${PLOT.y + PLOT.height - severity * PLOT.height * 0.9} ${PLOT.x + 60},${PLOT.y - severity * PLOT.height * 0.2} ${PLOT.x + 90},${PLOT.y}`;
  const rhPath = `M${PLOT.x},${PLOT.y + PLOT.height} q 60 0 100 -${severity * PLOT.height * 0.5} t 100 -${severity * PLOT.height * 0.4}`;

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="ABO compatibility matrix and reaction timelines">
      {/* Compatibility matrix. */}
      <text className={styles.label} x={GRID.x} y={GRID.y - 12}>
        DONOR (columns) → RECIPIENT (rows)
      </text>
      {ABO.NAMES.map((donor, di) => (
        <text key={`h-${donor}`} className={styles.matrixLabel} x={GRID.x + di * GRID.cell + 20} y={GRID.y + 12}>
          {donor}
        </text>
      ))}
      {ABO.NAMES.map((recipient, ri) => (
        <g key={`r-${recipient}`}>
          <text className={styles.matrixLabel} x={GRID.x - 14} y={GRID.y + ri * GRID.cell + 32}>
            {recipient}
          </text>
          {ABO.NAMES.map((_donor, di) => {
            const bad = aboMajorIncompatible(ri, di);
            const current =
              inputs.recipientAboIndex === ri && inputs.donorAboIndex === di;
            return (
              <rect
                key={`${ri}-${di}`}
                className={`${styles.matrixCell} ${bad ? styles.matrixBad : ''} ${current ? styles.matrixCurrent : ''}`}
                x={GRID.x + di * GRID.cell}
                y={GRID.y + 18 + ri * GRID.cell}
                width={GRID.cell - 4}
                height={GRID.cell - 4}
              />
            );
          })}
        </g>
      ))}

      {/* Reaction timeline. */}
      <rect className={styles.axis} x={PLOT.x} y={PLOT.y} width={PLOT.width} height={PLOT.height} fill="none" />
      <path
        className={styles.reactionCurve}
        d={aboPath}
        opacity={derived.aboIncompatible ? 1 : 0.15}
      />
      <path
        className={styles.rhCurve}
        d={rhPath}
        opacity={derived.rhIncompatible && derived.reactionArm.startsWith('delayed') ? 0.95 : 0.15}
      />
      <circle
        cx={derived.aboIncompatible ? PLOT.x + 90 : PLOT.x + 170}
        cy={derived.aboIncompatible ? PLOT.y : PLOT.y + PLOT.height - severity * PLOT.height * 0.55}
        r={5}
        fill="var(--transfusion)"
      />
      {/* One line by construction: the caption under the axis already says "after infusion". */}
      <DiagramText className={styles.label} x={PLOT.x} y={PLOT.y - 12} maxWidth={560 - PLOT.x - 16}>
        HAEMOLYSIS vs TIME
      </DiagramText>
      <text className={styles.caption} x={PLOT.x} y={PLOT.y + PLOT.height + 16}>
        minutes (IgM) · days (IgG) →
      </text>

      {/* Readout captions. */}
      <DiagramText className={styles.caption} x={44} y={300} maxWidth={500}>
        crossmatch: {derived.crossmatchVerdict}
      </DiagramText>
      <DiagramText className={styles.caption} x={44} y={322} maxWidth={500}>
        free Hb {derived.plasmaFreeHaemoglobin.toFixed(0)} · complement consumed{' '}
        {derived.complementConsumedPct.toFixed(0)}% · haemoglobinuria {derived.haemoglobinuriaPct.toFixed(0)}%
      </DiagramText>
      {(derived.dicRiskPct > 30 || derived.renalInjuryRiskPct > 30) && (
        <DiagramText className={styles.alarm} x={44} y={352} maxWidth={500} fontSize={12}>
          DIC risk {derived.dicRiskPct.toFixed(0)}% · renal injury {derived.renalInjuryRiskPct.toFixed(0)}% — stop the unit NOW
        </DiagramText>
      )}

      <DiagramText className={styles.verdict} x={44} y={386} maxWidth={500} fontSize={15} tracking={0.04}>
        {derived.classification}
      </DiagramText>
      <DiagramText
        className={styles.caption}
        x={44}
        y={406}
        maxWidth={500}
        fontSize={11}
        tracking={0.06}
      >
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
