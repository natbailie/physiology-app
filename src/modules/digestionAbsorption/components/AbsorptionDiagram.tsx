import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import { WATER } from '../engine/constants';
import type { DigestionDerived } from '../engine/types';
import styles from './Diagram.module.css';

interface AbsorptionDiagramProps {
  derived: DigestionDerived;
}

const STOOL = { x: 440, y: 150, width: 70, height: 120 };
const STOOL_MAX_ML = 3000;

/** The meal's journey: pancreas and liver feed the tube, the wall takes it up, the ileum
 * reclaims its salts and its B12, the colon makes a last stand against the water. */
export function AbsorptionDiagram({ derived }: AbsorptionDiagramProps) {
  const lumenLoad = clamp(derived.luminalMealLoad, 0, 2);
  const stoolHeight = (clamp(derived.stoolWaterMlPerDay, 0, STOOL_MAX_ML) / STOOL_MAX_ML) * STOOL.height;

  return (
    <DiagramFrame viewBox="0 0 560 440" ariaLabel="The digestive chain from pancreas and liver to stool">
      {/* The tube, segmented. */}
      <text className={styles.label} x={40} y={54}>
        THE CHAIN
      </text>
      <rect className={styles.organBox} x={40} y={64} width={110} height={70} />
      <rect className={styles.organBox} x={160} y={64} width={110} height={70} />
      <rect className={styles.organBox} x={280} y={64} width={90} height={70} />
      <rect className={styles.organBox} x={380} y={64} width={50} height={70} />

      <rect
        className={styles.gutLumen}
        x={42}
        y={96}
        width={386 * clamp(lumenLoad / 1, 0.04, 1)}
        height={6}
      />
      {/* Uptake fringe along the jejunum, scaled by surface area. */}
      <rect
        className={styles.absorbedFringe}
        x={162}
        y={128}
        width={106 * clamp(derived.enzymeFactor * (derived.currentMealFatAbsorptionPct / 100) + 0.08, 0.06, 1)}
        height={4}
      />

      <text className={styles.caption} x={48} y={82}>duodenum</text>
      <text className={styles.caption} x={172} y={82}>jejunum</text>
      <text className={styles.caption} x={288} y={82}>ileum</text>
      <text className={styles.caption} x={384} y={82}>colon</text>

      {/* Pancreas feeding enzymes; liver feeding bile. */}
      <path
        className={styles.enzymeArrow}
        d={`M 215 190 L 215 138`}
        opacity={0.15 + 0.55 * clamp(derived.enzymeFactor, 0, 1)}
      />
      <text className={styles.label} x={168} y={206}>
        PANCREAS · enzymes {(derived.enzymeFactor * 100).toFixed(0)}%
      </text>
      <path
        className={styles.bileLoop}
        d="M 100 250 C 100 200, 95 180, 95 136"
        opacity={0.15 + 0.55 * clamp(derived.bileEmulsificationFactor, 0, 1)}
      />
      <text className={styles.label} x={40} y={268}>
        LIVER · pool {derived.bileSaltPoolG.toFixed(1)} g · makes{' '}
        {derived.hepaticSynthesisGPerDay.toFixed(1)} g/day
      </text>

      {/* Ileal reclaim loop: salts back to the liver, B12 to the stores. */}
      <path
        className={styles.bileLoop}
        d="M 325 134 C 330 220, 240 240, 130 252"
        opacity={clamp(derived.spiltBileSaltsGPerDay > 0.05 ? 1 : 0.15, 0, 1) * 0.7}
        strokeDasharray="4 4"
      />
      <text className={styles.caption} x={268} y={244}>
        ileal reclaim
      </text>

      {/* Stool bucket with the day's water in it. */}
      <text className={styles.label} x={STOOL.x - 10} y={STOOL.y - 14}>
        STOOL
      </text>
      <rect className={styles.stoolFrame} x={STOOL.x} y={STOOL.y} width={STOOL.width} height={STOOL.height} />
      <rect
        className={styles.stoolFill}
        x={STOOL.x + 1}
        y={STOOL.y + STOOL.height - stoolHeight}
        width={STOOL.width - 2}
        height={stoolHeight}
      />
      <line
        className={styles.axis}
        x1={STOOL.x - 6}
        x2={STOOL.x + STOOL.width + 6}
        y1={STOOL.y + STOOL.height - ((WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY / STOOL_MAX_ML) * STOOL.height)}
        y2={STOOL.y + STOOL.height - ((WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY / STOOL_MAX_ML) * STOOL.height)}
      />
      <text className={styles.caption} x={STOOL.x - 44} y={STOOL.y + STOOL.height - 18}>
        200 ml
      </text>
      <text className={styles.caption} x={STOOL.x - 16} y={STOOL.y + STOOL.height + 18}>
        {derived.stoolWaterMlPerDay.toFixed(0)} ml/day
      </text>

      <text className={styles.caption} x={40} y={310}>
        fat uptake {derived.currentMealFatAbsorptionPct.toFixed(0)}% · faecal fat{' '}
        {derived.faecalFatGPerDay.toFixed(1)} g/day · lactose {derived.lactoseAbsorbedPct.toFixed(0)}%
      </text>
      <text className={styles.caption} x={40} y={328}>
        B12 store {(derived.b12StoreFraction * 100).toFixed(0)}% · iron store{' '}
        {(derived.ironStoreFraction * 100).toFixed(0)}% · nutrition {(derived.nutritionIndex * 100).toFixed(0)}%
      </text>
      {derived.stoolWaterMlPerDay >= WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY && (
        <text className={styles.alarm} x={40} y={350}>
          {derived.stoolClassification} — {derived.stoolWaterMlPerDay.toFixed(0)} ml/day
          {derived.stoolOsmoticGapHigh ? ' · osmotic gap HIGH' : ''}
        </text>
      )}

      <text className={styles.verdict} x={40} y={378}>
        {derived.classification}
      </text>
      <DiagramText className={styles.label} x={40} y={398} maxWidth={504} fontSize={11} tracking={0.06}>
        {derived.patternSummary}
      </DiagramText>
    </DiagramFrame>
  );
}
