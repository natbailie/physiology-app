// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { MODULES } from './moduleRegistry';
import { EXAMS, type ExamId } from './exams';
import { clearExamFilterForTests, matchesExam, seedExamFilter, setExamFilter } from './examFilter';

afterEach(clearExamFilterForTests);

describe('matchesExam', () => {
  it('shows everything when nothing is filtered', () => {
    expect(matchesExam(['FRCA_PRIMARY'], null)).toBe(true);
  });

  it('shows a module tagged for the chosen exam', () => {
    expect(matchesExam(['UKMLA', 'FRCA_PRIMARY'], 'FRCA_PRIMARY')).toBe(true);
  });

  it('hides a module tagged for other exams', () => {
    expect(matchesExam(['UKMLA'], 'FRCA_PRIMARY')).toBe(false);
  });

  /**
   * The deliberate reading of "not yet mapped". A learner who trusts the filter will skip what it
   * hides, so an untagged module shown in error costs them a moment and one hidden in error costs
   * them a question.
   */
  it('shows an untagged module under every filter', () => {
    expect(matchesExam(undefined, 'MRCS_PART_A')).toBe(true);
  });
});

describe('seedExamFilter', () => {
  it('adopts the saved exam when nothing is chosen for this tab', () => {
    seedExamFilter('MRCP_PART_1');
    expect(matchesExam(['UKMLA'], readFilter())).toBe(false);
  });

  /** A learner looking at another syllabus must not have it swapped back under them. */
  it('never overrules a filter the learner has already set', () => {
    setExamFilter('FRCA_PRIMARY');
    seedExamFilter('MRCP_PART_1');
    expect(readFilter()).toBe('FRCA_PRIMARY');
  });

  it('does nothing when the learner has saved no exam', () => {
    seedExamFilter(null);
    expect(readFilter()).toBeNull();
  });
});

/** Reads through the same storage the store hydrates from, rather than exporting internals. */
function readFilter(): ExamId | null {
  const stored = sessionStorage.getItem('physiologylab.examFilter');
  return (EXAMS.find((exam) => exam.id === stored)?.id ?? null) as ExamId | null;
}

/**
 * The tagging itself, as a ratchet.
 *
 * Not an assertion about which exams a given module belongs to — that is a judgement, and the
 * registry is where it is recorded. These hold the two properties that would make the FEATURE
 * wrong however the judgements land.
 */
describe('the exam tagging', () => {
  const simulators = MODULES.filter((module) => module.status === 'available' && module.kind !== 'reference');

  it('tags every available simulator', () => {
    const untagged = simulators.filter((module) => module.exams === undefined).map((module) => module.id);

    expect(untagged).toEqual([]);
  });

  /**
   * A filter that empties the catalogue is worse than no filter. Every exam offered in the picker
   * has to lead somewhere, so an exam added to `EXAMS` and never tagged fails here rather than
   * shipping as a chip that blanks the app.
   */
  it('leaves no exam in the picker with nothing behind it', () => {
    const empty = EXAMS.filter((exam) => !simulators.some((module) => module.exams?.includes(exam.id))).map(
      (exam) => exam.id,
    );

    expect(empty).toEqual([]);
  });

  /** The point of the filter is narrowing. An exam matching everything is a tagging mistake. */
  it('narrows the catalogue for every exam offered', () => {
    for (const exam of EXAMS) {
      const matched = simulators.filter((module) => matchesExam(module.exams, exam.id));
      expect(matched.length).toBeGreaterThan(0);
      expect(matched.length).toBeLessThan(simulators.length);
    }
  });
});
