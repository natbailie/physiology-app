import type { ReactNode } from 'react';
import styles from './MechanismDiagram.module.css';

interface MechanismDiagramProps {
  heading: string;
  readouts: ReactNode;
  controls: ReactNode;
  children: ReactNode;
}

/**
 * Scaffolding for an in-place mechanism diagram on a drug class page: the readout tiles, the
 * SVG drawing and the controls stacked in a card. Unlike a full simulator with a time axis and a
 * Step control, these are static-reactive — sliders feed a pure engine function and the picture
 * responds immediately, which is the right tool for a reference page a learner wants to interrogate
 * rather than watch run.
 */
export function MechanismDiagram({ heading, readouts, controls, children }: MechanismDiagramProps) {
  return (
    <section className={styles.card} aria-label={heading}>
      <h2 className={styles.heading}>{heading}</h2>
      <div className={styles.readouts}>{readouts}</div>
      <div className={styles.diagram}>{children}</div>
      <div className={styles.controls}>{controls}</div>
    </section>
  );
}
