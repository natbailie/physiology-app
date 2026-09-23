// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StudyStrip, type StudyStripProps } from './StudyStrip';

afterEach(cleanup);

const BASE: StudyStripProps = {
  dueCount: 0,
  known: 0,
  totalQuestions: 116,
  attempted: 0,
};

describe('StudyStrip', () => {
  it('shows nothing at all to someone who has never answered a question', () => {
    // A dashboard of zeroes is a worse first impression than no dashboard.
    const { container } = render(<StudyStrip {...BASE} />);
    expect(container.firstChild).toBeNull();
  });

  it('appears once there is a record to show', () => {
    render(<StudyStrip {...BASE} attempted={3} />);
    expect(screen.getByLabelText('Study progress')).toBeTruthy();
  });

  it('says so when there is nothing due', () => {
    render(<StudyStrip {...BASE} attempted={9} dueCount={0} known={40} />);
    expect(screen.getByText(/caught up/)).toBeTruthy();
  });

  it('offers no action of its own — the round above owns the one primary action', () => {
    // Two ranked lists off one review ladder, and the quieter of the two won on position.
    render(<StudyStrip {...BASE} attempted={9} dueCount={4} known={40} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByText(/Review/)).toBeNull();
  });

  it('shows no streak, because prescriptions here deliberately never expire', () => {
    render(<StudyStrip {...BASE} attempted={9} dueCount={1} known={40} />);
    expect(screen.queryByText(/in a row/)).toBeNull();
    expect(screen.queryByText(/streak/i)).toBeNull();
  });

  it('reads retention as an absolute count, never a percentage', () => {
    // Two out of a hundred and sixteen rounds to zero, and that learner has done real work.
    render(<StudyStrip {...BASE} attempted={9} known={2} />);
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('/116')).toBeTruthy();
  });
});
