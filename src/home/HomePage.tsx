import { useMemo } from 'react';
import { ModuleCard } from '@/shared/components/ModuleCard/ModuleCard';
import { useAuth } from '@/auth/AuthContext';
import { useProgressStore } from '@/shared/assessment/useProgressStore';
import { knownCount, mastery as masteryOf } from '@/shared/assessment/scheduling';
import { StudyStrip } from './StudyStrip';
import { questionIdsFor } from './moduleQuestionIds';
import { MODULES } from './moduleRegistry';
import styles from './HomePage.module.css';

interface ModuleProgress {
  mastery?: number;
  dueCount: number;
}

export function HomePage() {
  const { user, initialising } = useAuth();
  const store = useProgressStore();

  /**
   * One pass over every module.
   *
   * `allSummaries` is read once rather than calling `summary(id)` twenty-six times, because the
   * localStorage implementation re-reads and re-parses storage on every call.
   */
  const { progress, totals } = useMemo(() => {
    const summaries = store.allSummaries();
    const byModule: Record<string, ModuleProgress> = {};

    let due = 0;
    let attempted = 0;
    let known = 0;
    let totalQuestions = 0;
    let mostDue: { id: string; name: string; count: number } | null = null;

    for (const module of MODULES) {
      if (module.kind === 'reference') continue;
      const ids = questionIdsFor(module.id);
      totalQuestions += ids.length;

      const summary = summaries[module.id];
      if (!summary) {
        byModule[module.id] = { dueCount: 0 };
        continue;
      }

      const dueCount = store.due(module.id, ids).length;
      const moduleMastery = masteryOf(summary.schedule, ids);

      due += dueCount;
      attempted += summary.attempted;
      known += knownCount(summary.schedule, ids);
      byModule[module.id] = { mastery: moduleMastery, dueCount };

      if (dueCount > 0 && (mostDue === null || dueCount > mostDue.count)) {
        mostDue = { id: module.id, name: module.name, count: dueCount };
      }
    }

    return {
      progress: byModule,
      totals: {
        due,
        attempted,
        known,
        totalQuestions,
        reviewModuleId: mostDue?.id ?? null,
        reviewModuleName: mostDue?.name ?? null,
      },
    };
  }, [store]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Physiology Lab</h1>
          {!initialising && (
            <a href="#account" className={styles.accountLink}>
              {user ? user.email : 'Sign in'}
            </a>
          )}
        </div>
        <p className={styles.subtitle}>
          Interactive feedback-loop simulators for exam prep — pre-med through resident level (UKMLA, USMLE,
          MRCP). Pick a system to explore.
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

      <div className={styles.grid}>
        {MODULES.map((module) => (
          <ModuleCard key={module.id} {...module} {...(progress[module.id] ?? { dueCount: 0 })} />
        ))}
      </div>

      <p className={styles.footnote}>
        These are simplified, conceptual models built to teach mechanism — not clinical or diagnostic tools.
      </p>
    </div>
  );
}
