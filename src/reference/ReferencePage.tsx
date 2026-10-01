import { useState } from 'react';
import { FormulaCard } from './components/FormulaCard';
import { FORMULAS, type FormulaDomain } from './formulas';
import styles from './ReferencePage.module.css';
import { ThemeBar } from '@/theme/ThemeBar';

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
  const [query, setQuery] = useState('');
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = (formula: (typeof FORMULAS)[number]) => {
    const haystack = `${formula.name} ${formula.domain} ${formula.formulaDisplay}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  };
  const anyMatch = FORMULAS.some(matches);

  return (
    <div className={styles.page}>
      <ThemeBar />
      <header className={styles.header}>
        <h1 className={styles.title}>Formula Reference</h1>
        <span className={styles.subtitle}>
          {FORMULAS.length} high-yield equations &amp; calculators — most of them computed by a simulator
          in this app, and linked to it
        </span>
      </header>

      <label className={styles.searchWrap}>
        <span className="sr-only">Search formulas</span>
        <input
          type="search"
          className={styles.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “MAP”, “anion gap” or “cardiac output”"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <p className={styles.noMatch} role="status">
        {!anyMatch ? `No formulas match “${query.trim()}”. Try a shorter word, or clear the search.` : ''}
      </p>

      {DOMAINS.map((domain) => {
        const formulas = FORMULAS.filter((formula) => formula.domain === domain && matches(formula));
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
