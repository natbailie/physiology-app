import { describe, expect, it } from 'vitest';
import { MIN_STUDENTS, standingFor, type CohortProgressRow } from './aggregate';

const row = (
  user_id: string,
  module_id: string,
  attempted: number,
  correct: number,
): CohortProgressRow => ({
  cohort_id: 'c1',
  cohort_name: 'Year 2',
  user_id,
  module_id,
  attempted,
  correct,
  last_attempt_at: '2026-03-01T00:00:00Z',
});

/** A module answered by enough students to clear the suppression floor. */
const cohortOn = (moduleId: string, correctOf: (i: number) => number, students = MIN_STUDENTS) =>
  Array.from({ length: students }, (_, i) => row(`s${i}`, moduleId, 10, correctOf(i)));

describe('a cohort standing answers what to reteach', () => {
  it('counts a student once however many modules they have attempted', () => {
    const standing = standingFor([row('s1', 'respiratory', 4, 2), row('s1', 'cardiorenal', 6, 3)]);
    expect(standing.students).toBe(1);
    expect(standing.attempted).toBe(10);
  });

  it('puts the weakest module first, because that is the reason to open the page', () => {
    const standing = standingFor([
      ...cohortOn('strong', () => 9),
      ...cohortOn('weak', () => 2),
      ...cohortOn('middling', () => 6),
    ]);
    expect(standing.modules.map((m) => m.moduleId)).toEqual(['weak', 'middling', 'strong']);
  });

  it('breaks a tie on how many attempts back the finding', () => {
    // Two modules at 50%: the one the whole year sat is the more useful finding.
    const many = Array.from({ length: 8 }, (_, i) => row(`s${i}`, 'busy', 10, 5));
    const few = Array.from({ length: 5 }, (_, i) => row(`s${i}`, 'quiet', 2, 1));
    const standing = standingFor([...few, ...many]);
    expect(standing.modules[0]!.moduleId).toBe('busy');
  });

  it('withholds a module too few students have attempted', () => {
    const standing = standingFor(cohortOn('sparse', () => 1, MIN_STUDENTS - 1));
    const sparse = standing.modules.find((m) => m.moduleId === 'sparse')!;
    expect(sparse.withheld).toBe(true);
    expect(sparse.percent).toBeNull();
  });

  it('reports a withheld module as present rather than dropping it', () => {
    // A teacher must be able to tell "too few to show" from "nobody has opened it" — reading the
    // first as the second says a class is ignoring a topic it is merely new to.
    const standing = standingFor(cohortOn('sparse', () => 1, 2));
    expect(standing.modules.map((m) => m.moduleId)).toContain('sparse');
    expect(standing.modules.find((m) => m.moduleId === 'sparse')!.students).toBe(2);
  });

  it('publishes a module the moment it reaches the floor, and not before', () => {
    expect(standingFor(cohortOn('m', () => 5, MIN_STUDENTS - 1)).modules[0]!.withheld).toBe(true);
    expect(standingFor(cohortOn('m', () => 5, MIN_STUDENTS)).modules[0]!.withheld).toBe(false);
  });

  it('sorts every withheld module below every reported one', () => {
    const standing = standingFor([
      ...cohortOn('reported', () => 1), // 10% and still ranked above a withheld module
      ...cohortOn('withheld', () => 10, 2),
    ]);
    expect(standing.modules.at(-1)!.moduleId).toBe('withheld');
  });

  it('never reports a percentage a single student could recognise as their own', () => {
    const standing = standingFor([row('alone', 'private', 10, 3)]);
    expect(standing.modules[0]!.percent).toBeNull();
  });

  it('survives a cohort nobody has attempted anything in', () => {
    const standing = standingFor([]);
    expect(standing).toEqual({ students: 0, attempted: 0, modules: [] });
  });
});
