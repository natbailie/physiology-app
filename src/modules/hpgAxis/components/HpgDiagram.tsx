import type { CSSProperties } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import { HYPOTHALAMUS_PATH, PITUITARY_PATH } from '@/shared/diagram/organShapes';
import { clamp, scaleClamped } from '@/shared/lib/math';
import styles from './Diagram.module.css';
import type { HpgDerived } from '../engine/types';

interface HpgDiagramProps {
  derived: HpgDerived;
}

const OVARY_PATH = 'M-20,-4 C-20,-16 -8,-22 6,-19 C20,-16 24,-3 18,8 C12,19 -4,22 -14,14 C-19,10 -20,2 -20,-4 Z';
const TESTIS_PATH = 'M-16,-8 C-16,-20 0,-24 12,-17 C22,-11 22,6 12,15 C2,23 -14,18 -16,4 C-17,0 -17,-4 -16,-8 Z';

const GNRH_PATH = 'M110,84 C110,94 110,102 110,110';
const GONADOTROPIN_PATH = 'M138,140 C210,166 290,192 334,206';
const FEEDBACK_PATH = 'M346,192 C300,80 200,36 122,56';

export function HpgDiagram({ derived }: HpgDiagramProps) {
  const isFemale = derived.sex === 'female';
  const gonadalSteroid = isFemale ? derived.estrogenLevel : derived.testosteroneLevel;

  const hypothalamusStyle = { '--gnrh-drive': clamp(derived.gnrhDrive, 0, 1) } as CSSProperties;
  const pituitaryStyle = { '--lh-level': clamp(derived.lhLevel, 0, 1) } as CSSProperties;
  const gonadStyle = {
    '--steroid-level': clamp(gonadalSteroid, 0, 1),
    '--gonad-color': isFemale ? 'var(--estrogen)' : 'var(--testosterone)',
    '--cl-activity': clamp(derived.corpusLuteumActivity, 0, 1),
  } as CSSProperties;

  const inPositiveFeedback = derived.feedbackMode === 'positive';
  const follicleRadius = scaleClamped(derived.follicleSize, 0, 1, 0, 9);

  return (
    <DiagramFrame
      viewBox="0 0 480 300"
      ariaLabel="Animated diagram of the hypothalamic-pituitary-gonadal axis: the hypothalamus releasing GnRH, the pituitary releasing LH and FSH, and the gonad releasing steroid hormones that feed back on the axis"
      defs={
        <>
          <marker id="gnrh-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--gnrh)" />
          </marker>
          <marker id="gonadotropin-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="var(--lh)" />
          </marker>
          <marker id="hpg-feedback-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={isFemale ? 'var(--estrogen)' : 'var(--testosterone)'} />
          </marker>
        </>
      }
    >
      <HormoneArrow
        path={GNRH_PATH}
        activation={derived.gnrhDrive}
        colorVar="var(--gnrh)"
        label="GnRH"
        markerId="gnrh-arrow"
        labelPos={{ x: 120, y: 102 }}
      />
      <HormoneArrow
        path={GONADOTROPIN_PATH}
        activation={derived.lhLevel}
        colorVar="var(--lh)"
        label="LH / FSH"
        markerId="gonadotropin-arrow"
        labelPos={{ x: 214, y: 162 }}
      />
      {/* The one arrow in the whole app that changes sign: `inhibitory` is bound to the live
          feedback mode, so the switch to positive feedback is directly visible. */}
      <HormoneArrow
        path={FEEDBACK_PATH}
        activation={clamp(gonadalSteroid, 0, 1)}
        colorVar={isFemale ? 'var(--estrogen)' : 'var(--testosterone)'}
        label={inPositiveFeedback ? 'Positive feedback' : 'Negative feedback'}
        markerId="hpg-feedback-arrow"
        labelPos={{ x: 186, y: 38 }}
        inhibitory={!inPositiveFeedback}
      />

      <g transform="translate(110, 60)" style={hypothalamusStyle}>
        <path className={styles.hypothalamusShape} d={HYPOTHALAMUS_PATH} />
        <text className={styles.organLabel} y={-24}>
          Hypothalamus
        </text>
      </g>

      <g transform="translate(110, 128)" style={pituitaryStyle}>
        <path className={styles.pituitaryShape} d={PITUITARY_PATH} />
        <text className={styles.organLabel} y={24}>
          Pituitary
        </text>
      </g>

      <g transform="translate(356, 212)" style={gonadStyle}>
        <path className={styles.gonadShape} d={isFemale ? OVARY_PATH : TESTIS_PATH} />
        {isFemale && follicleRadius > 0.5 && <circle className={styles.follicle} cx={-4} cy={-2} r={follicleRadius} />}
        {isFemale && derived.corpusLuteumActivity > 0.02 && <circle className={styles.corpusLuteum} cx={8} cy={4} r={7} />}
        <text className={styles.organLabel} y={40}>
          {isFemale ? 'Ovary' : 'Testis'}
        </text>
      </g>

      <text className={inPositiveFeedback ? styles.feedbackPositive : styles.feedbackNegative} x={22} y={236}>
        {inPositiveFeedback ? '▲ Positive feedback — LH surge' : 'Negative feedback'}
      </text>

      {isFemale ? (
        <>
          <text className={styles.valueLabel} x={22} y={256}>
            Cycle day {derived.cycleDay} · {derived.cyclePhase}
          </text>
          <text className={styles.valueLabel} x={22} y={272}>
            E2 {(derived.estrogenLevel * 100).toFixed(0)}% · P4 {(derived.progesteroneLevel * 100).toFixed(0)}%
          </text>
        </>
      ) : (
        <>
          <text className={styles.valueLabel} x={22} y={256}>
            Testosterone {(derived.testosteroneLevel * 100).toFixed(0)}%
          </text>
          <text className={styles.valueLabel} x={22} y={272}>
            Inhibin {(derived.inhibinLevel * 100).toFixed(0)}%
          </text>
        </>
      )}
      <text className={styles.valueLabel} x={22} y={288}>
        LH {(derived.lhLevel * 100).toFixed(0)}% · FSH {(derived.fshLevel * 100).toFixed(0)}%
      </text>
    </DiagramFrame>
  );
}
