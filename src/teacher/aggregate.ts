/**
 * Turning per-student rows into what a module lead actually wants to know.
 *
 * `v_cohort_progress` returns one row per student per module. The dashboard never shows those
 * rows. It shows the cohort, because the question a teacher has before an exam is "where is my
 * year group struggling", not "how is this named student doing" — and because answering the
 * second one would change what this app has to tell learners about their data.
 *
 * ## The suppression floor is a privacy control, not a display preference
 *
 * A cohort average over one student IS that student's score, and over two it is recoverable by
 * anyone who knows their own. So a module with fewer than `MIN_STUDENTS` contributing is reported
 * as present-but-withheld rather than aggregated. Five is the threshold UK education statistics
 * conventionally suppress below, which is the number worth being able to name to a data protection
 * officer.
 *
 * Withheld is deliberately distinct from absent: a teacher must be able to tell "nobody has
 * touched this module" from "too few have for me to show you", or they will read the second as
 * the first and conclude their class is ignoring a topic they are merely new to.
 */

export interface CohortProgressRow {
  cohort_id: string;
  cohort_name: string;
  user_id: string;
  module_id: string;
  attempted: number;
  correct: number;
  last_attempt_at: string | null;
}

export interface ModuleStanding {
  moduleId: string;
  /** Distinct students who have attempted anything in this module. */
  students: number;
  attempted: number;
  correct: number;
  /** Null when withheld — there is no number to show, rather than a zero. */
  percent: number | null;
  withheld: boolean;
}

export interface CohortStanding {
  /** Distinct students who have attempted anything at all. */
  students: number;
  attempted: number;
  /** Weakest first: the reason to open this page is to find what to reteach. */
  modules: ModuleStanding[];
}

export const MIN_STUDENTS = 5;

export function standingFor(rows: readonly CohortProgressRow[]): CohortStanding {
  const byModule = new Map<string, { students: Set<string>; attempted: number; correct: number }>();
  const everyone = new Set<string>();
  let attempted = 0;

  for (const row of rows) {
    everyone.add(row.user_id);
    attempted += row.attempted;
    let bucket = byModule.get(row.module_id);
    if (!bucket) {
      bucket = { students: new Set(), attempted: 0, correct: 0 };
      byModule.set(row.module_id, bucket);
    }
    bucket.students.add(row.user_id);
    bucket.attempted += row.attempted;
    bucket.correct += row.correct;
  }

  const modules: ModuleStanding[] = [...byModule.entries()].map(([moduleId, bucket]) => {
    const withheld = bucket.students.size < MIN_STUDENTS;
    return {
      moduleId,
      students: bucket.students.size,
      attempted: bucket.attempted,
      correct: bucket.correct,
      percent: withheld || bucket.attempted === 0 ? null : Math.round((bucket.correct / bucket.attempted) * 100),
      withheld,
    };
  });

  // Weakest first, then most-attempted, so a topic the whole year is failing outranks one that
  // three people happened to get wrong. Withheld modules sort last: they carry no finding.
  modules.sort((a, b) => {
    if (a.withheld !== b.withheld) return a.withheld ? 1 : -1;
    if (a.percent !== b.percent) return (a.percent ?? 101) - (b.percent ?? 101);
    return b.attempted - a.attempted;
  });

  return { students: everyone.size, attempted, modules };
}
