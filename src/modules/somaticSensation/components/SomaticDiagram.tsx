import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import type { SomaticDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface SomaticDiagramProps {
  derived: SomaticDerived;
}

/** Cord cross-section with tract integrity drawn per side (dorsal columns vs spinothalamics,
 * syrinx in the middle), the gate meter, and the body-map of what survives below. */
export function SomaticDiagram({ derived }: SomaticDiagramProps) {
  const CORD = { x: 90, y: 70, width: 160, height: 120 };

  const dcLeftIntact = derived.touchLeftPct > 50;
  const dcRightIntact = derived.touchRightPct > 50;
  const stLeftIntact = derived.painTempRightPct > 50; // left ST carries RIGHT-sided pain
  const stRightIntact = derived.painTempLeftPct > 50;

  const gatePct = Math.round(derived.gateOpenFraction * 100);
  const GATE = { x: 320, y: 80, width: 200, height: 26 };

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="Spinal cord tracts, dorsal horn gate and modality map">
      <text className={styles.label} x={CORD.x} y={CORD.y - 14}>
        CORD BELOW THE LESION
      </text>

      <rect className={styles.cordOutline} x={CORD.x} y={CORD.y} width={CORD.width} height={CORD.height} rx={16} />

      {/* Dorsal columns (top), spinothalamics (bottom corners). */}
      <rect
        className={dcLeftIntact ? styles.columnDC : styles.columnDClost}
        x={CORD.x + 18}
        y={CORD.y + 12}
        width={52}
        height={40}
        rx={5}
      />
      <rect
        className={dcRightIntact ? styles.columnDC : styles.columnDClost}
        x={CORD.x + 90}
        y={CORD.y + 12}
        width={52}
        height={40}
        rx={5}
      />
      <rect
        className={stLeftIntact ? styles.columnST : styles.columnSTlost}
        x={CORD.x + 14}
        y={CORD.y + 62}
        width={44}
        height={46}
        rx={5}
      />
      <rect
        className={stRightIntact ? styles.columnST : styles.columnSTlost}
        x={CORD.x + 102}
        y={CORD.y + 62}
        width={44}
        height={46}
        rx={5}
      />
      {/* Syrinx cavity expanding from the central canal. */}
      {(derived.segmentalPainTempPct < 95) && (
        <ellipse
          className={styles.syrinxCavity}
          cx={CORD.x + CORD.width / 2}
          cy={CORD.y + 34}
          rx={Math.max(4, (100 - derived.segmentalPainTempPct) / 3.2)}
          ry={Math.max(3, (100 - derived.segmentalPainTempPct) / 4.5)}
        />
      )}
      <text className={styles.caption} x={CORD.x + 2} y={CORD.y + CORD.height + 18}>
        L: touch {derived.touchLeftPct.toFixed(0)}% · pain/R {derived.painTempRightPct.toFixed(0)}%
      </text>
      <text className={styles.caption} x={CORD.x + 2} y={CORD.y + CORD.height + 34}>
        R: touch {derived.touchRightPct.toFixed(0)}% · pain/L {derived.painTempLeftPct.toFixed(0)}%
      </text>

      {/* The dorsal-horn gate. */}
      <text className={styles.label} x={GATE.x} y={GATE.y - 24}>
        DORSAL HORN GATE · {gatePct}% OPEN
      </text>
      <rect className={styles.gateFrame} x={GATE.x} y={GATE.y} width={GATE.width} height={GATE.height} rx={6} />
      <rect
        className={styles.gateBar}
        x={GATE.x}
        y={GATE.y}
        width={(GATE.width * gatePct) / 100}
        height={GATE.height}
        fill="var(--nociception)"
        opacity={0.75}
        rx={6}
      />
      <DiagramText className={styles.caption} x={GATE.x} y={GATE.y + GATE.height + 20} maxWidth={560 - GATE.x - 16}>
        C-fibre {derived.cFibreTraffic.toFixed(0)} · Aδ {derived.adDeltaTraffic.toFixed(0)} · Aβ{' '}
        {derived.abTraffic.toFixed(0)}
      </DiagramText>
      <DiagramText className={styles.caption} x={GATE.x} y={GATE.y + GATE.height + 38} maxWidth={560 - GATE.x - 16}>
        first pain {derived.firstPainLatencyMs.toFixed(0)} ms · second pain{' '}
        {derived.secondPainLatencyMs.toFixed(0)} ms · touch {derived.touchLatencyMs.toFixed(0)} ms
      </DiagramText>
      {derived.allodyniaActive && (
        <DiagramText className={styles.alarm} x={GATE.x} y={GATE.y + GATE.height + 58} maxWidth={560 - GATE.x - 16} fontSize={12}>
          ALLODYNIA — Aβ traffic now driving pain pathways
        </DiagramText>
      )}

      <text className={styles.verdict} x={90} y={300}>
        pain {derived.perceivedPainScore.toFixed(1)}/10
      </text>
      <DiagramText className={styles.caption} x={90} y={318} maxWidth={454}>
        transmission output {derived.transmissionCellOutput.toFixed(0)} · descending brake{' '}
        {derived.descendingModulation.toFixed(0)} · rubbing {derived.rubbingGateDrive.toFixed(0)}
      </DiagramText>
      <DiagramText className={styles.caption} x={90} y={350} maxWidth={454}>
        segmental (syrinx level) pain/temp preserved {derived.segmentalPainTempPct.toFixed(0)}%
      </DiagramText>

      <DiagramText className={styles.verdict} x={90} y={376} maxWidth={454} fontSize={15} tracking={0.04}>
        {derived.classification}
      </DiagramText>
      <DiagramText
        className={styles.label}
        x={90}
        y={398}
        maxWidth={454}
        fontSize={11}
        tracking={0.06}
      >
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
