import { describe, expect, it } from 'vitest';
import { claimedQuestionIds, unclaimedQuestions } from './unclaimed';

const QUESTIONS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

describe('claimedQuestionIds', () => {
  it('gathers every bed’s ids', () => {
    expect([...claimedQuestionIds([{ questionIds: ['a'] }, { questionIds: ['c', 'd'] }])].sort()).toEqual(
      ['a', 'c', 'd'],
    );
  });

  it('treats a bed with no questions as claiming nothing', () => {
    expect(claimedQuestionIds([{}, { questionIds: [] }]).size).toBe(0);
  });
});

describe('unclaimedQuestions', () => {
  it('returns what no bed collects, in authoring order', () => {
    const left = unclaimedQuestions(QUESTIONS, [{ questionIds: ['c'] }, { questionIds: ['a'] }]);
    expect(left.map((q) => q.id)).toEqual(['b', 'd']);
  });

  it('returns everything when there are no beds', () => {
    expect(unclaimedQuestions(QUESTIONS, []).map((q) => q.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('returns nothing when the beds claim the lot', () => {
    expect(unclaimedQuestions(QUESTIONS, [{ questionIds: ['a', 'b', 'c', 'd'] }])).toEqual([]);
  });

  /** Ids a module does not have cannot remove anything — a stale `questionIds` entry is caught
   *  by `caseSuite`, and must not silently hide a real question here. */
  it('ignores a claimed id that is not among the questions', () => {
    expect(unclaimedQuestions(QUESTIONS, [{ questionIds: ['zzz'] }]).map((q) => q.id)).toEqual([
      'a', 'b', 'c', 'd',
    ]);
  });
});
