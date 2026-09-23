import { describe, expect, it } from 'vitest';
import { acuityOf } from './acuity';
import type { ReviewState } from '@/shared/assessment/scheduling';

const NOW = Date.parse('2026-03-01T09:00:00Z');
const DAY = 86_400_000;

/** A review state, defaulted to "answered today, sitting comfortably". */
const state = (over: Partial<ReviewState> = {}): ReviewState => ({
  box: 4,
  dueAt: NOW + 16 * DAY,
  lapses: 0,
  lastAt: NOW,
  ...over,
});

describe('acuityOf', () => {
  it('calls a bed nobody has been to a new admission', () => {
    expect(acuityOf({}, ['a', 'b'], NOW)).toBe('newAdmission');
  });

  it('calls a patient with a twice-forgotten question a crash', () => {
    const schedule = { a: state(), b: state({ lapses: 2, box: 1 }) };
    expect(acuityOf(schedule, ['a', 'b'], NOW)).toBe('crash');
  });

  it('prefers crash over due — a lapse is the sharper signal', () => {
    const schedule = { a: state({ dueAt: NOW - DAY }), b: state({ lapses: 3 }) };
    expect(acuityOf(schedule, ['a', 'b'], NOW)).toBe('crash');
  });

  it('calls a patient with a question come round again due', () => {
    const schedule = { a: state(), b: state({ dueAt: NOW - DAY }) };
    expect(acuityOf(schedule, ['a', 'b'], NOW)).toBe('due');
  });

  it('calls a fully retained patient a check', () => {
    const schedule = { a: state(), b: state({ box: 3 }) };
    expect(acuityOf(schedule, ['a', 'b'], NOW)).toBe('check');
  });

  /** The case the ordering exists for: a bed half met is work outstanding, not an empty bed. */
  it('calls a part-studied patient due rather than a new admission', () => {
    const schedule = { a: state() };
    expect(acuityOf(schedule, ['a', 'b'], NOW)).toBe('due');
  });

  /** Seen, not due, not yet retained. It will come round — saying "check" would sign off a
   * patient the ladder has not finished with. */
  it('does not sign off a patient still climbing the ladder', () => {
    const schedule = { a: state({ box: 1 }), b: state({ box: 2 }) };
    expect(acuityOf(schedule, ['a', 'b'], NOW)).toBe('due');
  });

  it('treats a case with no questions as unmet rather than retained', () => {
    expect(acuityOf({ a: state() }, [], NOW)).toBe('newAdmission');
  });
});
