// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StudyStrip, type StudyStripProps } from './StudyStrip';

afterEach(cleanup);

const BASE: StudyStripProps = {
  dueCount: 0,
  streakDays: 0,
  known: 0,
  totalQuestions: 116,
  attempted: 0,
  reviewModuleId: null,
  reviewModuleName: null,
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

  it('points at the module holding the most overdue work', () => {
    render(
      <StudyStrip
        {...BASE}
        attempted={9}
        dueCount={4}
        reviewModuleId="respiratory"
        reviewModuleName="Respiratory & Acid-Base"
      />,
    );
    const action = screen.getByRole('link', { name: /Review Respiratory/ });
    expect(action.getAttribute('href')).toBe('#respiratory');
  });

  it('says so when there is nothing due, rather than offering an empty review', () => {
    render(<StudyStrip {...BASE} attempted={9} dueCount={0} known={40} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(/caught up/)).toBeTruthy();
  });

  it('pluralises the streak', () => {
    render(<StudyStrip {...BASE} attempted={1} streakDays={1} />);
    expect(screen.getByText('day in a row')).toBeTruthy();

    cleanup();
    render(<StudyStrip {...BASE} attempted={1} streakDays={4} />);
    expect(screen.getByText('days in a row')).toBeTruthy();
  });
});
