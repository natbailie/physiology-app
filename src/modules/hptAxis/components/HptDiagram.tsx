import { EndocrineAxis } from '@/shared/components/EndocrineAxis/EndocrineAxis';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import { T4 } from '../engine/constants';
import type { HptDerived } from '../engine/types';
import { ThyroidGland } from './ThyroidGland';
import styles from './Diagram.module.css';

interface HptDiagramProps {
  derived: HptDerived;
}

/**
 * The HPT axis on the shared endocrine scaffold.
 *
 * One thing here belongs to no other axis: what the thyroid secretes is mostly T4, and T4 is
 * largely a prohormone. The active hormone is made in the peripheral tissues by deiodination,
 * so the conversion step is drawn on the circulation where it happens. That is what makes
 * conversion efficiency a lever at all, and why someone can have a normal T4 and still be
 * hypothyroid at the tissue.
 */
export function HptDiagram({ derived }: HptDiagramProps) {
  const t4 = clamp(derived.t4Level / T4.MAX_UGDL, 0, 1);
  const conversion = clamp(derived.conversionEfficiency, 0, 1.5);

  return (
    <EndocrineAxis
      ariaLabel="The hypothalamic-pituitary-thyroid axis: TRH down the portal vessels, TSH through the circulation to the thyroid, T4 secreted and converted peripherally to T3, feeding back on the pituitary and hypothalamus"
      releasing={{ label: 'TRH', level: clamp(derived.trhDrive, 0, 1), colorVar: 'var(--co2)' }}
      trophic={{ label: 'TSH', level: clamp(derived.tshLevel, 0, 1), colorVar: 'var(--tsh)' }}
      product={{ label: 'T4', level: t4, colorVar: 'var(--thyroid)' }}
      pituitaryFunction={clamp(derived.pituitaryTshFunction, 0, 1)}
      glandFunction={clamp(derived.thyroidGlandFunction, 0, 1)}
      glandLabel="Thyroid"
      renderGland={(intensity) => (
        <ThyroidGland intensity={intensity} glandFunction={clamp(derived.thyroidGlandFunction, 0, 1)} />
      )}
      exogenous={{ label: 'Levothyroxine', level: clamp(derived.exogenousLevothyroxine / 100, 0, 1) }}
      targetTissue={{
        label: 'Every tissue',
        detail: 'basal metabolic rate, heat production, gut and heart rate',
      }}
    >
      {/* Peripheral deiodination, drawn on the circulation because that is where it happens. */}
      <g className={styles.conversion} style={{ '--conversion': conversion } as React.CSSProperties}>
        <path d="M 300 296 L 336 296" markerEnd="url(#axisExcite)" />
        <text className={styles.conversionLabel} x={296} y={286} textAnchor="end">
          T4
        </text>
        <text className={styles.conversionLabel} x={340} y={286}>
          T3
        </text>
        <text className={styles.conversionTick} x={318} y={312} textAnchor="middle">
          {(conversion * 100).toFixed(0)}%
        </text>
      </g>

      <text className={styles.label} x={20} y={410}>
        T4 {derived.t4Level.toFixed(1)} · T3 {derived.t3Level.toFixed(1)} · TSH{' '}
        {(derived.tshLevel * 100).toFixed(0)}%
      </text>
      <DiagramText className={styles.caption} x={20} y={430} maxWidth={520}>
        conversion {(derived.conversionEfficiency * 100).toFixed(0)}% · TRH drive{' '}
        {(derived.trhDrive * 100).toFixed(0)}%
      </DiagramText>
    </EndocrineAxis>
  );
}
