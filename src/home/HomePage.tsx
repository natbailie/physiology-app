import { ModuleCard } from '@/shared/components/ModuleCard/ModuleCard';
import { DisciplineCard } from '@/shared/components/DisciplineCard/DisciplineCard';
import { useAuth } from '@/auth/AuthContext';
import { useEntitlement } from '@/billing/useEntitlement';
import { useProgressStore } from '@/shared/assessment/useProgressStore';
import { StudyStrip } from './StudyStrip';
import { StudyReport } from './StudyReport';
import { DISCIPLINES, MODULES, THEMES, type DisciplineId } from './moduleRegistry';
import { MEDICATIONS } from '@/medications/drugs';
import { useModuleProgress } from './useModuleProgress';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { BrandMark } from '@/shared/components/BrandMark/BrandMark';
import styles from './HomePage.module.css';

export function HomePage() {
  const { user, initialising } = useAuth();
  const { isUnlocked } = useEntitlement();
  const store = useProgressStore();
  const { totals, weakSpots } = useModuleProgress();

  const reference = MODULES.find((module) => module.kind === 'reference');

  // Simulators per subject, counted through the theme each module belongs to so a tile can
  // never claim a size the pages below it will not actually show. Reference pages (the
  // formula sheet, the medications hub) are not simulators and are excluded.
  const disciplineOf = new Map(THEMES.map((theme) => [theme.id, theme.discipline]));
  const byDiscipline = new Map<DisciplineId, number>();
  for (const module of MODULES) {
    if (!module.theme || module.kind === 'reference') continue;
    const discipline = disciplineOf.get(module.theme);
    if (discipline) byDiscipline.set(discipline, (byDiscipline.get(discipline) ?? 0) + 1);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <BrandMark as="h1" />
          <div className={styles.headerActions}>
            <ThemeToggle />
            {!initialising && (
              <a href="#account" className={styles.accountLink}>
                <span className={styles.accountLabel}>{user ? 'Account' : 'Access'}</span>
                <span className={styles.accountValue}>{user ? user.email : 'Sign in'}</span>
              </a>
            )}
          </div>
        </div>
        <p className={styles.subtitle}>
          Interactive feedback-loop simulators for exam prep — pre-med through resident level (UKMLA, USMLE,
          MRCP). Pick a subject to explore.
        </p>
      </header>

      <StudyStrip
        dueCount={totals.due}
        streakDays={store.streak()}
        known={totals.known}
        totalQuestions={totals.totalQuestions}
        attempted={totals.attempted}
        reviewModuleId={totals.reviewModuleId}
        reviewModuleName={totals.reviewModuleName}
      />

      <StudyReport weakSpots={weakSpots} />

      <div className={styles.disciplineGrid}>
        {DISCIPLINES.map((discipline) => {
          const count = byDiscipline.get(discipline.id) ?? 0;
          return (
            <DisciplineCard
              key={discipline.id}
              {...discipline}
              href={discipline.href ?? `#discipline/${discipline.id}`}
              countText={
                discipline.id === 'pharmacology'
                  ? `${MEDICATIONS.length} classes`
                  : `${count} simulator${count === 1 ? '' : 's'}`
              }
            />
          );
        })}
      </div>

      {reference && (
        <section className={styles.tools}>
          <h2 className={styles.toolsTitle}>Tools</h2>
          <div className={styles.toolsGrid}>
            <ModuleCard {...reference} locked={!isUnlocked(reference.id)} />
          </div>
        </section>
      )}

      <p className={styles.footnote}>
        These are simplified, conceptual models built to teach mechanism — not clinical or diagnostic tools.
      </p>
    </div>
  );
}