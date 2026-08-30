import type { WeakSpot, WeaknessReason } from '@/shared/assessment/weakness';
import { MODULES } from './moduleRegistry';
import styles from './StudyReport.module.css';

/** How many rows are worth reading. Beyond about five this stops being advice and becomes a list. */
const MAX_ROWS = 5;

export interface StudyReportProps {
  weakSpots: readonly WeakSpot[];
}

/**
 * Phrasing for each reason, in the second person and sentence case.
 *
 * The reason tag is computed in `weakness.ts`; the words live here so the pure layer stays free
 * of prose and rewording the copy does not fail a test.
 */
function reasonText(spot: WeakSpot): string {
  const reasons: Record<WeaknessReason, string> = {
    repeatedLapses:
      spot.worstLapses === 2
        ? 'A question here has come back round and caught you twice.'
        : `A question here has caught you ${spot.worstLapses} times.`,
    lowAccuracy: `${spot.correct} of ${spot.attempted} right so far.`,
    stale:
      spot.daysSinceReview >= 60
        ? 'Answered well, but months ago now.'
        : `Answered well, but not for ${spot.daysSinceReview} days.`,
    thinCoverage: `${spot.unseen} of ${spot.totalQuestions} questions still unseen.`,
  };
  return reasons[spot.reason];
}

/**
 * What to work on next, and why.
 *
 * Absent until a learner has answered something, on the same reasoning as `StudyStrip`: a report
 * that says nothing is worse than no report. It is also absent once nothing is weak, which is the
 * point of `rankWeaknesses` returning only modules with something actually wrong with them —
 * being told you have no weak spots is a result worth seeing rather than an empty table.
 */
export function StudyReport({ weakSpots }: StudyReportProps) {
  if (weakSpots.length === 0) return null;

  const names = new Map(MODULES.map((module) => [module.id, module.name]));
  const rows = weakSpots.slice(0, MAX_ROWS);

  return (
    <section className={styles.report} aria-labelledby="study-report-title">
      <h2 className={styles.title} id="study-report-title">
        Worth another look
      </h2>

      <ul className={styles.list}>
        {rows.map((spot) => (
          <li key={spot.moduleId} className={styles.row}>
            <a className={styles.name} href={`#${spot.moduleId}`}>
              {names.get(spot.moduleId) ?? spot.moduleId}
            </a>
            <span className={styles.reason}>{reasonText(spot)}</span>
            <span
              className={styles.meter}
              role="img"
              aria-label={`${Math.round(spot.mastery * 100)} per cent known`}
            >
              <span
                className={styles.meterFill}
                style={{ width: `${Math.max(spot.mastery * 100, 2)}%` }}
              />
            </span>
            {spot.dueCount > 0 && (
              <span className={styles.due} aria-label={`${spot.dueCount} due for review`}>
                {spot.dueCount} due
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
