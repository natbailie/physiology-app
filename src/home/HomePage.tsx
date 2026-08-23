import { ModuleCard } from '@/shared/components/ModuleCard/ModuleCard';
import { useAuth } from '@/auth/AuthContext';
import { MODULES } from './moduleRegistry';
import styles from './HomePage.module.css';

export function HomePage() {
  const { user, initialising } = useAuth();

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

      <div className={styles.grid}>
        {MODULES.map((module) => (
          <ModuleCard key={module.id} {...module} />
        ))}
      </div>

      <p className={styles.footnote}>
        These are simplified, conceptual models built to teach mechanism — not clinical or diagnostic tools.
      </p>
    </div>
  );
}
