import { FormulaCard } from './components/FormulaCard';
import { FORMULAS, type FormulaDomain } from './formulas';
import styles from './ReferencePage.module.css';

/** Order reads roughly the way a pre-clinical course does, not alphabetically. */
const DOMAINS: readonly FormulaDomain[] = [
  'Cardiovascular',
  'Respiratory',
  'Acid-base',
  'Renal',
  'Haematology',
  'Neuro & muscle',
];

export function ReferencePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.backLink} href="#">
          &larr; Modules
        </a>
        <h1 className={styles.title}>Formula Reference</h1>
        <span className={styles.subtitle}>
          {FORMULAS.length} high-yield equations &amp; calculators — most of them computed by a simulator
          in this app, and linked to it
        </span>
      </header>

      {DOMAINS.map((domain) => {
        const formulas = FORMULAS.filter((formula) => formula.domain === domain);
        if (formulas.length === 0) return null;
        return (
          <section key={domain} className={styles.section}>
            <h2 className={styles.sectionTitle}>{domain}</h2>
            <div className={styles.grid}>
              {formulas.map((formula) => (
                <FormulaCard key={formula.id} formula={formula} />
              ))}
            </div>
          </section>
        );
      })}

      <p className={styles.footnote}>
        Reference values and simplified formulas for exam prep — not a clinical or diagnostic tool.
      </p>
    </div>
  );
}
