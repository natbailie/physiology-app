import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import type { PituitaryDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface PituitaryDiagramProps {
  derived: PituitaryDerived;
}

/** Sellar mass with chiasma, the dopamine brake meter, and hormone readout bars. */
export function PituitaryDiagram({ derived }: PituitaryDiagramProps) {
  const massR = 6 + clamp(derived.totalMassCc / 12, 0, 1) * 30;
  const fieldOpacity = derived.visualFieldDefectPct / 130;

  const BRAKE = { x: 330, y: 84, width: 190, height: 22 };
  const brakePct = clamp(derived.effectiveDopamineFraction, 0, 1.2);

  const BAR = (y: number) => ({ x: 330, y, width: 190, height: 16 });
  const ghPct = clamp(derived.ghNgMl / 25, 0, 1);
  const prlPct = clamp(derived.prolactinNgMl / 400, 0, 1);
  const igfPct = clamp(derived.igf1NgMl / 800, 0, 1);

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="Sellar mass, dopamine brake and anterior pituitary outputs">
      {/* Sella with mass and optic chiasm above. */}
      <text className={styles.label} x={44} y={40}>
        SELLA TURCICA
      </text>
      <ellipse cx={120} cy={140} rx={62} ry={46} className={styles.glandNode} />
      <circle
        className={styles.massCircle}
        cx={120 + clamp(derived.totalMassCc * 1.4, 0, 14)}
        cy={132 - clamp(derived.totalMassCc, 0, 8)}
        r={massR}
      />
      <text className={styles.caption} x={70} y={204}>
        mass {derived.totalMassCc.toFixed(1)} cm³
      </text>

      {/* Optic chiasma with bitemporal wedges when compressed. */}
      <path className={styles.glandNode} d="M 88 66 h 64 m -32 -14 v 28" />
      {/* Sits above SELLA TURCICA rather than beside it: the two labels shared a baseline and
          overlapped, and the chiasm is the structure above the sella in any case. */}
      <text className={styles.label} x={76} y={24}>
        OPTIC CHIASMA
      </text>
      {fieldOpacity > 0.02 && (
        <>
          <polygon
            className={styles.fieldWedge}
            points={`56,52 ${56 - 34 * fieldOpacity},34 ${56 - 34 * fieldOpacity},70`}
          />
          <polygon
            className={styles.fieldWedge}
            points={`184,52 ${184 + 34 * fieldOpacity},34 ${184 + 34 * fieldOpacity},70`}
          />
          <text className={styles.alarm} x={214} y={60}>
            bitemporal loss {derived.visualFieldDefectPct.toFixed(0)}%
          </text>
        </>
      )}

      {/* Dopamine brake meter. */}
      <text className={styles.label} x={BRAKE.x} y={BRAKE.y - 10}>
        DOPAMINE BRAKE · {(brakePct * 100).toFixed(0)}% EFFECTIVE
      </text>
      <rect className={styles.brakeFrame} x={BRAKE.x} y={BRAKE.y} width={BRAKE.width} height={BRAKE.height} rx={5} />
      <rect className={styles.brakeBar} x={BRAKE.x} y={BRAKE.y} width={(BRAKE.width * brakePct) / 1.2} height={BRAKE.height} fill="var(--pituitary)" opacity={0.8} />
      <DiagramText
        className={styles.caption}
        x={BRAKE.x}
        y={BRAKE.y + BRAKE.height + 18}
        maxWidth={560 - BRAKE.x - 16}
      >
        tone × receptor × stalk — drugs attack the middle term
      </DiagramText>

      {/* Hormone output bars. */}
      <text className={styles.label} x={330} y={168}>
        GH {derived.ghNgMl.toFixed(1)} ng/mL
      </text>
      <rect className={styles.brakeFrame} {...BAR(174)} rx={4} />
      <rect className={styles.brakeBar} x={330} y={174} width={(BAR(0).width * ghPct)} height={16} fill="var(--basal-ganglia)" opacity={0.85} />

      <text className={styles.label} x={330} y={216}>
        PROLACTIN {derived.prolactinNgMl.toFixed(0)} ng/mL
      </text>
      <rect className={styles.brakeFrame} {...BAR(222)} rx={4} />
      <rect className={styles.brakeBar} x={330} y={222} width={(BAR(0).width * prlPct)} height={16} fill="var(--ige)" opacity={0.85} />

      <text className={styles.label} x={330} y={264}>
        IGF-1 {derived.igf1NgMl.toFixed(0)} ng/mL
      </text>
      <rect className={styles.brakeFrame} {...BAR(270)} rx={4} />
      <rect className={styles.brakeBar} x={330} y={270} width={(BAR(0).width * igfPct)} height={16} fill="var(--ok)" opacity={0.85} />

      <DiagramText className={styles.caption} x={330} y={312} maxWidth={214}>
        {`gonadal suppression ${derived.gonadalSuppressionPct.toFixed(0)}% · height velocity ${
          derived.heightVelocityCmPerYear > 0
            ? `${derived.heightVelocityCmPerYear.toFixed(1)} cm/yr`
            : 'plates fused'
        }`}
      </DiagramText>

      {(derived.glucoseSuppressionTest !== 'not tested' || derived.acromegalicIndex > 20) && (
        <DiagramText className={styles.alarm} x={44} y={340} maxWidth={500} fontSize={12}>
          {derived.glucoseSuppressionTest !== 'not tested'
            ? `glucose test: ${derived.glucoseSuppressionTest.toUpperCase()}`
            : `acromegalic overgrowth index ${derived.acromegalicIndex.toFixed(0)}`}
        </DiagramText>
      )}

      <DiagramText className={styles.verdict} x={44} y={364} maxWidth={500} fontSize={15} tracking={0.04}>
        {derived.classification}
      </DiagramText>
      <DiagramText
        className={styles.caption}
        x={44}
        y={390}
        maxWidth={500}
        fontSize={11}
        tracking={0.06}
      >
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
