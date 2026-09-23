import { MODULES } from '@/home/moduleRegistry';
import { FREE_MODULE_IDS } from './config';
import styles from './Paywall.module.css';
import { ThemeBar } from '@/theme/ThemeBar';

const FREE_MODULES = MODULES.filter((m) => FREE_MODULE_IDS.has(m.id) && m.status === 'available');

/**
 * Shown in place of a module the learner has not paid for. It names what they reached for and
 * offers somewhere to go next — a locked door with no handle just loses the visit.
 */
export function Paywall({ moduleId }: { moduleId: string }) {
  const module = MODULES.find((m) => m.id === moduleId);

  return (
    <div className={styles.page}>
      <ThemeBar />
      <a href="#" className={styles.backLink}>
        ← All modules
      </a>
      <h1 className={styles.title}>{module ? module.name : 'This module'} is part of full access</h1>
      <p className={styles.body}>
        {module ? `${module.tagline}. ` : ''}
        Full access opens every simulator and the whole practice-question bank, with the worked
        explanation behind each answer.
      </p>

      <a href="#pricing" className={styles.cta}>
        See what is included
      </a>

      <div className={styles.freeNote}>
        Free on your account already:
        <ul className={styles.freeList}>
          {FREE_MODULES.map((m) => (
            <li key={m.id} className={styles.freeItem}>
              <a href={`#${m.id}`}>{m.name}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
