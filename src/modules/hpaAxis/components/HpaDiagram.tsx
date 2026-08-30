import { EndocrineAxis } from '@/shared/components/EndocrineAxis/EndocrineAxis';
import { DiagramText } from '@/shared/components/DiagramText/DiagramText';
import { clamp } from '@/shared/lib/math';
import { CORTISOL } from '../engine/constants';
import type { HpaDerived } from '../engine/types';
import { AdrenalGland } from './AdrenalGland';
import styles from './Diagram.module.css';

interface HpaDiagramProps {
  derived: HpaDerived;
}

/**
 * The HPA axis on the shared endocrine scaffold.
 *
 * What the three featureless blobs could not show, and this can: exogenous glucocorticoid
 * entering the circulation without passing through the axis at all, suppressing CRH and ACTH
 * from there, and the adrenal CORTEX thinning as a result while the medulla is untouched. That
 * sequence — drug in, axis off, cortex wasted, and no cortisol of your own when the drug stops —
 * is the whole clinical point of the module, and none of it was previously drawn.
 */
export function HpaDiagram({ derived }: HpaDiagramProps) {
  const cortisol = clamp(derived.cortisolLevel / CORTISOL.MAX_UGDL, 0, 1);

  return (
    <EndocrineAxis
      ariaLabel="The hypothalamic-pituitary-adrenal axis: CRH down the portal vessels to the anterior pituitary, ACTH through the circulation to the adrenal cortex, and cortisol feeding back on both, with exogenous glucocorticoid entering the circulation from outside the axis"
      releasing={{ label: 'CRH', level: clamp(derived.crhDrive, 0, 1), colorVar: 'var(--co2)' }}
      trophic={{ label: 'ACTH', level: clamp(derived.acthLevel, 0, 1), colorVar: 'var(--acth)' }}
      product={{ label: 'Cortisol', level: cortisol, colorVar: 'var(--cortisol)' }}
      pituitaryFunction={clamp(derived.pituitaryFunction, 0, 1)}
      glandFunction={clamp(derived.adrenalCortexFunction, 0, 1)}
      glandLabel="Adrenal"
      renderGland={(intensity) => <AdrenalGland intensity={intensity} reserve={clamp(derived.adrenalReserve, 0, 1)} />}
      exogenous={{ label: 'Exogenous steroid', level: clamp(derived.exogenousGlucocorticoid / 100, 0, 1) }}
      targetTissue={{
        label: 'Liver · muscle · immune system',
        detail: 'gluconeogenesis up, protein broken down, inflammation damped',
      }}
    >
      <text className={styles.label} x={20} y={410}>
        Cortisol {derived.cortisolLevel.toFixed(1)} µg/dL · ACTH {(derived.acthLevel * 100).toFixed(0)}%
      </text>
      <DiagramText className={styles.caption} x={20} y={430} maxWidth={520}>
        adrenal reserve {(derived.adrenalReserve * 100).toFixed(0)}% · CRH drive{' '}
        {(derived.crhDrive * 100).toFixed(0)}%
      </DiagramText>
    </EndocrineAxis>
  );
}
