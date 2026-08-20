import styles from './ExplainerPanel.module.css';

export interface ExplainerContent {
  title: string;
  paragraphs: string[];
}

interface ExplainerPanelProps {
  content: ExplainerContent;
  /** Collapse on load. Only for modules where the mechanism text is long enough to
   * bury the controls. */
  startCollapsed?: boolean;
}

/** Concise "what's happening / why it matters" mechanism text for a module.
 * Open by default: sliders and numbers with no framing is a poor first encounter with
 * a mechanism, and the panel sits below the readouts and charts so it displaces nothing. */
export function ExplainerPanel({ content, startCollapsed = false }: ExplainerPanelProps) {
  return (
    <details className={styles.panel} open={!startCollapsed}>
      <summary className={styles.summary}>
        <h2 className={styles.title}>{content.title}</h2>
        <span className={styles.chevron} aria-hidden="true" />
      </summary>
      <div className={styles.paragraphs}>
        {content.paragraphs.map((paragraph) => (
          <p key={paragraph} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
    </details>
  );
}
