import { ModuleCard } from '@/shared/components/ModuleCard/ModuleCard';
import { useEntitlement } from '@/billing/useEntitlement';
import { DISCIPLINES, MODULES, THEMES, type ThemeId } from './moduleRegistry';
import { useModuleProgress } from './useModuleProgress';
import styles from './ThemePage.module.css';

interface ThemePageProps {
  themeId: ThemeId;
}

/** The drill-down half of the home screen: one theme's worth of module cards. App.tsx only
 * routes here with an id from THEMES, so the lookup failing is a wiring bug, not a user state. */
export function ThemePage({ themeId }: ThemePageProps) {
  const theme = THEMES.find((t) => t.id === themeId);
  const { isUnlocked } = useEntitlement();
  const { progress } = useModuleProgress();

  if (!theme) return null;

  const modules = MODULES.filter((module) => module.theme === themeId);

  // Back goes up one tier, to the subject this theme sits under. A discipline that skips its
  // own page (its href points straight at a hub) has nowhere for that link to land, so the
  // trail falls back to the picker.
  const discipline = DISCIPLINES.find((d) => d.id === theme.discipline);
  const backHref = discipline?.href ? '#home' : `#discipline/${theme.discipline}`;
  const backLabel = discipline?.href ? 'All subjects' : (discipline?.name ?? 'All subjects');

  return (
    <div className={styles.page}>
      <nav className={styles.backRow}>
        <a href={backHref} className={styles.backLink}>
          ← {backLabel}
        </a>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>{theme.name}</h1>
        <p className={styles.blurb}>{theme.blurb}</p>
      </header>

      <div className={styles.grid}>
        {modules.map((module) => (
          <ModuleCard
            key={module.id}
            {...module}
            {...(progress[module.id] ?? { dueCount: 0 })}
            locked={module.status === 'available' && !isUnlocked(module.id)}
          />
        ))}
      </div>

      <p className={styles.footnote}>
        These are simplified, conceptual models built to teach mechanism — not clinical or diagnostic tools.
      </p>
    </div>
  );
}