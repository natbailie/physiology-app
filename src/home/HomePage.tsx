import { ModuleCard } from '@/shared/components/ModuleCard/ModuleCard';
import { DisciplineCard } from '@/shared/components/DisciplineCard/DisciplineCard';
import { useState } from 'react';
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
import { matchesExam, useExamFilter } from './examFilter';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { BrandMark } from '@/shared/components/BrandMark/BrandMark';
import { Skeleton } from '@/shared/components/Skeleton/Skeleton';
import { Illustration } from '@/shared/components/Illustration/Illustration';
import styles from './HomePage.module.css';

/** Module id -> display name. Module-scope so `useRound`'s memo sees a stable function. */
const MODULE_NAMES = new Map(MODULES.map((module) => [module.id, module.name]));
const moduleNameOf = (moduleId: string): string => MODULE_NAMES.get(moduleId) ?? moduleId;

/** Every query word has to appear in the module's name or its one-line description. */
function matchesQuery(module: { name: string; tagline: string }, query: string): boolean {
  const haystack = `${module.name} ${module.tagline}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export function HomePage() {
  const { user, initialising } = useAuth();
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  const entitlement = useEntitlement();
  const { isUnlocked } = entitlement;
  const { progress, totals, weakSpots } = useModuleProgress();
  const round = useRound(moduleNameOf, entitlement);
  const examFilter = useExamFilter();

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
            {initialising ? (
              // Holds the chip's place while the session resolves, so the header does not jump.
              <span className={styles.accountLink} aria-busy="true">
                <Skeleton width="4rem" height="0.7rem" />
                <Skeleton width="9rem" height="0.85rem" />
              </span>
            ) : (
              <a href="#account" className={styles.accountLink}>
                <span className={styles.accountLabel}>{user ? 'Account' : 'Access'}</span>
                <span className={styles.accountValue}>{user ? user.email : 'Sign in'}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      <section
        className={`${styles.hero} ${totals.attempted > 0 ? styles.heroUnderStrip : ''}`}
        aria-labelledby="home-hero-title"
      >
        <div className={styles.heroText}>
          <h2 id="home-hero-title" className={styles.heroTitle}>
            What shall we study today?
          </h2>
          <p className={styles.subtitle}>
            Interactive simulators for exam prep, from pre-med to resident (USMLE Step 1, MRCS Part A,
            Primary FRCA, UKMLA, MRCP(UK) Part 1). Search, or pick a subject.
          </p>
          <label className={styles.searchWrap}>
            <span className="sr-only">Search simulators</span>
            <input
              type="search"
              className={styles.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “cardiac output”, “ABG” or “shock”"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </div>
        <Illustration kind="welcome" size={132} className={styles.heroArt} />
      </section>

      {/* Rides up over the hero's bottom edge, so the two read as one object. Absent until the
          learner has answered something (see StudyStrip). */}
      <div className={styles.overlap}>
        <StudyStrip
          dueCount={totals.due}
          known={totals.known}
          totalQuestions={totals.totalQuestions}
          attempted={totals.attempted}
        />
      </div>

      <ExamPrompt />
      <ExamFilterBar />

      {searching && (
        <section className={styles.results} aria-label="Search results" aria-live="polite">
          {(() => {
            const hits = MODULES.filter(
              (module) =>
                module.status === 'available' &&
                matchesExam(module.exams, examFilter) &&
                matchesQuery(module, query),
            );
            if (hits.length === 0) {
              return (
                <div className={styles.empty}>
                  <Illustration kind="search" size={96} />
                  <p className={styles.emptyTitle}>Nothing matches “{query.trim()}” yet</p>
                  <p className={styles.emptyBody}>
                    Try a shorter word, like “renal” or “heart”, or clear the search to browse by subject.
                  </p>
                  <button type="button" className={styles.clear} onClick={() => setQuery('')}>
                    Clear search
                  </button>
                </div>
              );
            }
            return (
              <div className={styles.resultGrid}>
                {hits.map((module) => (
                  <ModuleCard
                    key={module.id}
                    {...module}
                    {...(progress[module.id] ?? {})}
                    locked={!isUnlocked(module.id)}
                  />
                ))}
              </div>
            );
          })()}
        </section>
      )}

      <div className={styles.disciplineGrid} hidden={searching}>
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