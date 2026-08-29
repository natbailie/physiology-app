import { ModuleCard } from '@/shared/components/ModuleCard/ModuleCard';
import { ThemeCard } from '@/shared/components/ThemeCard/ThemeCard';
import { useAuth } from '@/auth/AuthContext';
import { useEntitlement } from '@/billing/useEntitlement';
import { useProgressStore } from '@/shared/assessment/useProgressStore';
import { StudyStrip } from './StudyStrip';
import { MODULES, THEMES, type ThemeId } from './moduleRegistry';
import { MEDICATIONS } from '@/medications/drugs';
import { useModuleProgress } from './useModuleProgress';
import { ThemeToggle } from '@/theme/ThemeToggle';
import styles from './HomePage.module.css';

export function HomePage() {
  const { user, initialising } = useAuth();
  const { isUnlocked } = useEntitlement();
  const store = useProgressStore();
  const { totals } = useModuleProgress();

  const reference = MODULES.find((module) => module.kind === 'reference');

  // Counted in the same pass as the theme grid renders, so a theme can never claim a module
  // size that the filter below will not actually display.
  const byTheme = new Map<ThemeId, number>();
  for (const module of MODULES) {
    if (module.theme) byTheme.set(module.theme, (byTheme.get(module.theme) ?? 0) + 1);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Physiology Lab</h1>
          <div className={styles.headerActions}>
            <ThemeToggle />
            {!initialising && (
              <a href="#account" className={styles.accountLink}>
                {user ? user.email : 'Sign in'}
              </a>
            )}
          </div>
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

      <div className={styles.themeGrid}>
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            {...theme}
            moduleCount={byTheme.get(theme.id) ?? 0}
            countText={theme.id === 'medications' ? `${MEDICATIONS.length} classes` : undefined}
          />
        ))}
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