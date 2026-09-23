import { useEffect } from 'react';
import { ModuleCard } from '@/shared/components/ModuleCard/ModuleCard';
import { DisciplineCard } from '@/shared/components/DisciplineCard/DisciplineCard';
import { useAuth } from '@/auth/AuthContext';
import { useEntitlement } from '@/billing/useEntitlement';
import { RoundBoard } from './RoundBoard';
import { useRound } from './useRound';
import { StudyStrip } from './StudyStrip';
import { StudyReport } from './StudyReport';
import { DISCIPLINES, MODULES, THEMES, type DisciplineId } from './moduleRegistry';
import { MEDICATIONS } from '@/medications/drugs';
import { useModuleProgress } from './useModuleProgress';
import { ExamPrompt } from './ExamPrompt';
import { ExamFilterBar } from './ExamFilterBar';
import { matchesExam, seedExamFilter, useExamFilter } from './examFilter';
import { useExamProfile } from '@/account/examProfile';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { BrandMark } from '@/shared/components/BrandMark/BrandMark';
import styles from './HomePage.module.css';

/** Module id -> display name. Module-scope so `useRound`'s memo sees a stable function. */
const MODULE_NAMES = new Map(MODULES.map((module) => [module.id, module.name]));
const moduleNameOf = (moduleId: string): string => MODULE_NAMES.get(moduleId) ?? moduleId;

export function HomePage() {
  const { user, initialising } = useAuth();
  const entitlement = useEntitlement();
  const { isUnlocked } = entitlement;
  const { totals, weakSpots } = useModuleProgress();
  const round = useRound(moduleNameOf, entitlement);
  const { targetExam, ready } = useExamProfile();
  const examFilter = useExamFilter();

  // The saved exam becomes the starting filter on a first visit, and never overrules a learner
  // who has since chosen to look at something else — see `seedExamFilter`.
  //
  // In an effect rather than in the render body, which is where this started. Seeding during
  // render notified the store's subscribers mid-render, and `examFilter` above had ALREADY been
  // read as null for this pass — so the counts below were computed unfiltered and the learner
  // watched "51 simulators" flip to "23". Committing first costs one honest re-render instead.
  useEffect(() => {
    if (ready) seedExamFilter(targetExam);
  }, [ready, targetExam]);

  const reference = MODULES.find((module) => module.kind === 'reference');

  // Simulators per subject, counted through the theme each module belongs to so a tile can
  // never claim a size the pages below it will not actually show. Reference pages (the
  // formula sheet, the medications hub) are not simulators and are excluded.
  const disciplineOf = new Map(THEMES.map((theme) => [theme.id, theme.discipline]));
  const byDiscipline = new Map<DisciplineId, number>();
  for (const module of MODULES) {
    if (!module.theme || module.kind === 'reference') continue;
    if (!matchesExam(module.exams, examFilter)) continue;
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

      <ExamPrompt />
      <ExamFilterBar />

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

      {/* The round sits BELOW the subject grid. Picking what to study is the decision a learner
          arrives with; the round is what they do once they have picked, and on a first visit it
          is a ward of people they have never met. Above the grid it answered a question nobody
          had asked yet. */}
      <RoundBoard round={round} />

      <StudyStrip
        dueCount={totals.due}
        known={totals.known}
        totalQuestions={totals.totalQuestions}
        attempted={totals.attempted}
      />

      <StudyReport weakSpots={weakSpots} />

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