import styles from './StudyStrip.module.css';

export interface StudyStripProps {
  dueCount: number;
  streakDays: number;
  /** Questions retained, and how many there are in total. An absolute count rather than a
   * percentage: two questions out of a hundred and sixteen rounds to zero, and a returning
   * learner who has just done real work should not be told they have made none. */
  known: number;
  totalQuestions: number;
  attempted: number;
  /** Where the most overdue work is, for the primary action. */
  reviewModuleId: string | null;
  reviewModuleName: string | null;
}

/**
 * What a returning learner sees first.
 *
 * Deliberately absent until they have answered something. A dashboard of zeroes is a worse
 * first impression than no dashboard at all, and the whole point of this strip is to be the
 * reason someone opens the app on a given morning — which it cannot be for a person who has
 * never used it.
 */
export function StudyStrip({
  dueCount,
  streakDays,
  known,
  totalQuestions,
  attempted,
  reviewModuleId,
  reviewModuleName,
}: StudyStripProps) {
  if (attempted === 0) return null;

  return (
    <section className={styles.strip} aria-label="Study progress">
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.statDue}`}>{dueCount}</span>
          <span className={styles.statLabel}>due today</span>
        </div>
        <span className={styles.divider} aria-hidden="true" />
        <div className={styles.stat}>
          <span className={styles.statValue}>{streakDays}</span>
          <span className={styles.statLabel}>day{streakDays === 1 ? '' : 's'} in a row</span>
        </div>
        <span className={styles.divider} aria-hidden="true" />
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {known}
            <span className={styles.statOf}>/{totalQuestions}</span>
          </span>
          <span className={styles.statLabel}>known</span>
        </div>
      </div>

      {dueCount > 0 && reviewModuleId ? (
        <a className={styles.action} href={`#${reviewModuleId}`}>
          Review {reviewModuleName}
        </a>
      ) : (
        <span className={styles.caughtUp}>
          {known === totalQuestions
            ? 'Every question retained. Nothing due.'
            : 'Nothing due — you are caught up for today.'}
        </span>
      )}
    </section>
  );
}
