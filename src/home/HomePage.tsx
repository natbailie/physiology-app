import { ModuleCard } from '@/shared/components/ModuleCard/ModuleCard';
import { MODULES } from './moduleRegistry';
import styles from './HomePage.module.css';

export function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Physiology Lab</h1>
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
