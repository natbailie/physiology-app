import { ThemeCard } from '@/shared/components/ThemeCard/ThemeCard';
import { MEDICATIONS } from '@/medications/drugs';
import { DISCIPLINES, MODULES, THEMES, type DisciplineId } from './moduleRegistry';
import { ExamFilterBar } from './ExamFilterBar';
import { matchesExam, useExamFilter } from './examFilter';
import styles from './DisciplinePage.module.css';
import { ThemeBar } from '@/theme/ThemeBar';

interface DisciplinePageProps {
  disciplineId: DisciplineId;
}

/** The middle tier of the catalogue: one subject's worth of theme cards. App.tsx only routes
 * here with an id from DISCIPLINES, so the lookup failing is a wiring bug, not a user state. */
export function DisciplinePage({ disciplineId }: DisciplinePageProps) {
  const discipline = DISCIPLINES.find((d) => d.id === disciplineId);
  const examFilter = useExamFilter();

  if (!discipline) return null;

  const allThemes = THEMES.filter((theme) => theme.discipline === disciplineId);

  // Counted in the same pass the grid renders from, so a theme can never claim a module
  // count that the page behind it will not actually display — which is exactly why the exam
  // filter has to be applied HERE too. A card promising three simulators that opens on an empty
  // theme reads as a broken link rather than as a filter doing its job.
  const byTheme = new Map<string, number>();
  for (const module of MODULES) {
    if (module.theme && matchesExam(module.exams, examFilter)) {
      byTheme.set(module.theme, (byTheme.get(module.theme) ?? 0) + 1);
    }
  }

  // A theme with nothing left in it under the current filter is dropped rather than shown
  // reading "0 simulators": the count is the card's whole purpose, and zero is not an invitation.
  // The medications hub counts drug classes rather than modules, so it is never filtered out.
  const themes = allThemes.filter(
    (theme) => examFilter === null || theme.id === 'medications' || (byTheme.get(theme.id) ?? 0) > 0,
  );

  return (
    <div className={styles.page}>
      <nav className={styles.backRow}>
        <ThemeBar />
        <a href="#home" className={styles.backLink}>
          ← All subjects
        </a>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>{discipline.name}</h1>
        <p className={styles.blurb}>{discipline.blurb}</p>
      </header>

      <ExamFilterBar />

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
