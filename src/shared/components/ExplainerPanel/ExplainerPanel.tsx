import styles from './ExplainerPanel.module.css';

export interface ExplainerContent {
  title: string;
  paragraphs: string[];
}

interface ExplainerPanelProps {
  content: ExplainerContent;
}

/** Concise "what's happening / why it matters" mechanism text for a module.
 * Collapsed by default so it stays available without pushing the live readouts
 * and charts down the page. */
export function ExplainerPanel({ content }: ExplainerPanelProps) {
  return (
    <details className={styles.panel}>
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
