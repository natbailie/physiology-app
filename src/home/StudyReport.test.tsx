// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { WeakSpot } from '@/shared/assessment/weakness';
import { StudyReport } from './StudyReport';

afterEach(cleanup);

function spot(overrides: Partial<WeakSpot> & Pick<WeakSpot, 'moduleId' | 'reason'>): WeakSpot {
  return {
    attempted: 10,
    correct: 5,
    accuracy: 0.5,
    mastery: 0.25,
    lapses: 2,
    worstLapses: 1,
    dueCount: 0,
    unseen: 0,
    totalQuestions: 10,
    daysSinceReview: 0,
    score: 0.5,
    ...overrides,
  };
}

describe('StudyReport', () => {
  it('shows nothing when nothing is weak', () => {
    // Not an empty table. Having no weak spots is a result, and the absence says it.
    const { container } = render(<StudyReport weakSpots={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('names the module and links to it', () => {
    render(<StudyReport weakSpots={[spot({ moduleId: 'respiratory', reason: 'lowAccuracy' })]} />);

    const link = screen.getByRole('link', { name: 'Respiratory & Acid-Base' });
    expect(link.getAttribute('href')).toBe('#respiratory');
  });

  it('gives the reason in the learner`s own numbers rather than a tag', () => {
    render(
      <StudyReport
        weakSpots={[spot({ moduleId: 'respiratory', reason: 'lowAccuracy', correct: 3, attempted: 11 })]}
      />,
    );

    expect(screen.getByText('3 of 11 right so far.')).toBeTruthy();
  });

  it('says how many times a repeatedly missed question has caught them', () => {
    render(
      <StudyReport
        weakSpots={[spot({ moduleId: 'renalTubular', reason: 'repeatedLapses', worstLapses: 4 })]}
      />,
    );

    expect(screen.getByText('A question here has caught you 4 times.')).toBeTruthy();
  });

  it('keeps the list short enough to act on', () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      spot({ moduleId: `module${index}`, reason: 'lowAccuracy' }),
    );

    render(<StudyReport weakSpots={many} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });

  it('renders mastery as a labelled meter, not only as a bar', () => {
    // `prefers-reduced-motion` and screen readers both need the value in text.
    render(<StudyReport weakSpots={[spot({ moduleId: 'respiratory', reason: 'stale', mastery: 0.4 })]} />);

    expect(screen.getByLabelText('40 per cent known')).toBeTruthy();
  });

  it('hides the decorative prescription glyph from screen readers', () => {
    // The ℞ is decoration; the words "Prescribed for you" carry the meaning.
    render(<StudyReport weakSpots={[spot({ moduleId: 'respiratory', reason: 'lowAccuracy' })]} />);
    const heading = screen.getByRole('heading', { name: /prescribed for you/i });
    const glyph = heading.querySelector('[aria-hidden="true"]');
    expect(glyph?.textContent).toContain('℞');
  });

  it('shows the due count only when something is due', () => {
    const { container } = render(
      <StudyReport weakSpots={[spot({ moduleId: 'respiratory', reason: 'stale', dueCount: 0 })]} />,
    );
    expect(container.querySelector('[class*="due"]')).toBeNull();

    cleanup();
    render(<StudyReport weakSpots={[spot({ moduleId: 'respiratory', reason: 'stale', dueCount: 3 })]} />);
    expect(screen.getByLabelText('3 due for review')).toBeTruthy();
  });
});
