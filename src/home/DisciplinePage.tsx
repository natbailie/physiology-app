import { ThemeCard } from '@/shared/components/ThemeCard/ThemeCard';
import { MEDICATIONS } from '@/medications/drugs';
import { DISCIPLINES, MODULES, THEMES, type DisciplineId } from './moduleRegistry';
import styles from './DisciplinePage.module.css';

interface DisciplinePageProps {
  disciplineId: DisciplineId;
}

/** The middle tier of the catalogue: one subject's worth of theme cards. App.tsx only routes
 * here with an id from DISCIPLINES, so the lookup failing is a wiring bug, not a user state. */
export function DisciplinePage({ disciplineId }: DisciplinePageProps) {
  const discipline = DISCIPLINES.find((d) => d.id === disciplineId);

  if (!discipline) return null;

  const themes = THEMES.filter((theme) => theme.discipline === disciplineId);

  // Counted in the same pass the grid renders from, so a theme can never claim a module
  // count that the page behind it will not actually display.
  const byTheme = new Map<string, number>();
  for (const module of MODULES) {
    if (module.theme) byTheme.set(module.theme, (byTheme.get(module.theme) ?? 0) + 1);
  }

  return (
    <div className={styles.page}>
      <nav className={styles.backRow}>
        <a href="#home" className={styles.backLink}>
          ← All subjects
        </a>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>{discipline.name}</h1>
        <p className={styles.blurb}>{discipline.blurb}</p>
      </header>

      <div className={styles.grid}>
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            {...theme}
            moduleCount={byTheme.get(theme.id) ?? 0}
            countText={theme.id === 'medications' ? `${MEDICATIONS.length} classes` : undefined}
          />
        ))}
      </div>

      <p className={styles.footnote}>
        These are simplified, conceptual models built to teach mechanism — not clinical or diagnostic tools.
      </p>
    </div>
  );
}
