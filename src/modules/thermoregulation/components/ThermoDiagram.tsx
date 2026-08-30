import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { ThermoDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface ThermoDiagramProps {
  derived: ThermoDerived;
}

/** Body silhouette with core/skin temperatures, heat flows drawn as arrows sized by value,
 * and the set-point vs core gap that defines fever, defence and crisis. */
export function ThermoDiagram({ derived }: ThermoDiagramProps) {
  const coreHeat = clamp((derived.coreTempC - 35) / 8, 0.1, 1);

  const shiverPct = clamp(derived.shiveringW / 500, 0, 1);
  const sweatPct = clamp(derived.sweatW / 850, 0, 1);
  const BAR = (y: number) => ({ x: 320, y, width: 200, height: 16 });

  const dryArrow = derived.dryLossW;
  const evapArrow = derived.sweatW + 22;

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="Body heat flows and the hypothalamic set point">
      {/* Body with core disc. */}
      <ellipse className={styles.bodyOutline} cx={140} cy={150} rx={72} ry={98} />
      <circle
        className={styles.coreDisc}
        cx={140}
        cy={150}
        r={40}
        style={{ '--heat': (coreHeat * 100).toFixed(0) } as React.CSSProperties}
      />
      <text className={styles.label} x={92} y={52}>
        Core {derived.coreTempC.toFixed(2)} °C · skin {derived.skinTempC.toFixed(1)} °C
      </text>

      {/* Heat flow arrows: production inside, losses out. */}
      <line className={styles.prodArrow} x1={60} y1={150} x2={100} y2={150} markerEnd="url(#arrow)" />
      <text className={styles.caption} x={20} y={140}>
        +{derived.metabolicHeatW.toFixed(0)} W
      </text>
      <line
        className={styles.lossArrow}
        x1={214}
        y1={110}
        x2={264}
        y2={110}
        opacity={clamp(dryArrow / 300, 0.06, 1)}
        style={{ transform: dryArrow < 0 ? 'rotate(180deg)' : undefined, transformOrigin: '239px 110px' }}
      />
      <text className={styles.caption} x={216} y={100}>
        dry {dryArrow >= 0 ? '' : '+'}
        {Math.abs(dryArrow).toFixed(0)} W
      </text>
      <line className={styles.lossArrow} x1={214} y1={190} x2={264} y2={190} opacity={clamp(evapArrow / 600, 0.06, 1)} />
      <text className={styles.caption} x={218} y={180}>
        evaporative {evapArrow.toFixed(0)} W
      </text>

      {/* Set point vs core gauge. */}
      <text className={styles.label} x={330} y={64}>
        Set point {derived.setPointC.toFixed(1)} °C
      </text>
      <rect
        className={styles.setpointBand}
        x={330}
        y={74 + clamp((41 - Math.max(derived.setPointC, derived.coreTempC)) / 6, 0, 1) * 120}
        width={190}
        height={10}
        fill="var(--warn)"
        opacity={0.7}
      />
      <rect className={styles.axisLine} x={330} y={74} width={190} height={130} fill="none" stroke="var(--panel-border)" />
      <circle cx={330 + clamp((derived.coreTempC - 35) / 6, 0, 1) * 190} cy={79 + clamp((41 - derived.coreTempC) / 6, 0, 1) * 120} r={6} fill="var(--danger)" />

      {/* Effectors. */}
      <text className={styles.label} x={330} y={232}>
        Shivering {derived.shiveringW.toFixed(0)} W
      </text>
      <rect className={styles.effectorFrame} {...BAR(240)} rx={4} />
      <rect className={styles.effectorBar} x={330} y={240} width={(BAR(0).width * shiverPct)} height={16} fill="var(--sympathetic)" opacity={0.85} />

      <text className={styles.label} x={330} y={286}>
        Sweating {derived.sweatW.toFixed(0)} W
      </text>
      <rect className={styles.effectorFrame} {...BAR(294)} rx={4} />
      <rect className={styles.effectorBar} x={330} y={294} width={(BAR(0).width * sweatPct)} height={16} fill="var(--o2)" opacity={0.85} />

      <text className={styles.caption} x={44} y={318}>
        storage {derived.netStorageW >= 0 ? '+' : ''}
        {derived.netStorageW.toFixed(0)} W · error {derived.defenceErrorC >= 0 ? '+' : ''}
        {derived.defenceErrorC.toFixed(2)} °C vs point
      </text>
      {(derived.feverRising || derived.classification.startsWith('hyperthermia') || derived.classification.startsWith('heat stroke')) && (
        <text className={styles.alarm} x={44} y={338}>
          {derived.feverRising
            ? 'Rigors — the body is heating itself to a defended point'
            : 'Heat emergency — cooling now, not antipyretics'}
        </text>
      )}

      <text className={styles.verdict} x={44} y={368}>
        {derived.classification}
      </text>
      <DiagramText
        className={styles.caption}
        x={44}
        y={388}
        maxWidth={500}
        fontSize={11}
        tracking={0.06}
      >
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
