import { memo } from 'react';
import { MODULES } from '@/home/moduleRegistry';
import styles from './RelatedModules.module.css';

interface RelatedModulesProps {
  moduleId: string;
}

/**
 * Where to go next, and why.
 *
 * The app siloes concepts a patient does not: hyperkalaemia is modelled in three modules, DKA
 * in three, heart failure in four. Each was reachable only by already knowing it existed and
 * going back to the home page to find it.
 *
 * Each link leads with the REASON rather than the destination — "see hyperkalaemia on the ECG"
 * rather than "ECG & Cardiac Conduction" — because a learner deciding whether to follow a link
 * needs to know what they will get, not where they will land.
 */
function RelatedModulesBase({ moduleId }: RelatedModulesProps) {
  const module = MODULES.find((entry) => entry.id === moduleId);
  const related = module?.related ?? [];
  if (related.length === 0) return null;

  return (
    <nav className={styles.wrap} aria-label="Related modules">
      <span className={styles.heading}>See also</span>
      <ul className={styles.list}>
        {related.map((link) => {
          const target = MODULES.find((entry) => entry.id === link.id);
          if (!target) return null;
          return (
            <li key={link.id} className={styles.item}>
              <a className={styles.link} href={`#${link.id}`}>
                {target.name}
              </a>
              <span className={styles.why}>{link.why}</span>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const RelatedModules = memo(RelatedModulesBase);
