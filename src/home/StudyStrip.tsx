import styles from './StudyStrip.module.css';

export interface StudyStripProps {
  dueCount: number;
  /** Questions retained, and how many there are in total. An absolute count rather than a
   * percentage: two questions out of a hundred and sixteen rounds to zero, and a returning
   * learner who has just done real work should not be told they have made none. */
  known: number;
  totalQuestions: number;
  attempted: number;
}

/**
 * What a returning learner sees under the round: two figures and a status, and no action.
 *
 * Deliberately absent until they have answered something. A dashboard of zeroes is a worse
 * first impression than no dashboard at all.
 *
 * Two things this strip used to do and no longer does, both for the same reason — the round
 * above it is the product, and this is the read-out beside it:
 *
 * - **No "Review X" button.** It pointed at a MODULE while the board above pointed at a
 *   PATIENT, so the page offered two primary actions ranked off one review ladder and the
 *   quieter of the two won on position. `RoundBoard`'s "Start round" is the single action now.
 * - **No streak.** "N days in a row" is loss aversion wearing a lab coat, and it is the exact
 *   device the rest of this app refuses: `StudyReport`'s prescriptions deliberately never
 *   expire, and `currentStreak`'s own leniency exists so a missed day does not punish. Keeping
 *   the counter on screen reintroduced through a number what the scheduling had designed out.
 *   `ProgressStore.streak()` is untouched — this removes a display, not a capability.
 */
export function StudyStrip({ dueCount, known, totalQuestions, attempted }: StudyStripProps) {
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
          <span className={styles.statValue}>
            {known}
            <span className={styles.statOf}>/{totalQuestions}</span>
          </span>
          <span className={styles.statLabel}>known</span>
        </div>
      </div>

      {dueCount === 0 && (
        <span className={styles.caughtUp}>
          {known === totalQuestions
            ? 'Every question retained. Nothing due.'
            : 'Nothing due — you are caught up for today.'}
        </span>
      )}
    </section>
  );
}
