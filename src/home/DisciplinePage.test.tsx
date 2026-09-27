// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DisciplinePage } from './DisciplinePage';

afterEach(cleanup);

describe('DisciplinePage', () => {
  it('shows the subject title, and offers no back link of its own', () => {
    render(<DisciplinePage disciplineId="physiology" />);
    expect(screen.getByRole('heading', { name: 'Physiology' })).toBeTruthy();
    // Going back is the NavArrows' job now, and theirs alone. A page that also offers a worded
    // link gives two ways to do one thing, and they disagree: the link goes UP the catalogue
    // while the arrow retraces where the learner has actually been.
    expect(screen.queryByRole('link', { name: /All subjects/i })).toBeNull();
  });

  it('renders the theme cards the registry files under the subject', () => {
    render(<DisciplinePage disciplineId="physiology" />);
    const cardiovascular = screen.getByRole('link', { name: /Cardiovascular/ });
    expect(cardiovascular.getAttribute('href')).toBe('#theme/cardiovascular');
    expect(screen.getByRole('link', { name: /Cell & Molecular/ })).toBeTruthy();
  });

  it('stays within its own subject — the drug hub belongs to pharmacology', () => {
    render(<DisciplinePage disciplineId="physiology" />);
    expect(screen.queryByRole('link', { name: /Medications/ })).toBeNull();
  });

  it('renders nothing for a discipline the registry does not list', () => {
    const { container } = render(<DisciplinePage disciplineId="astrology" />);
    expect(container.firstChild).toBeNull();
  });
});
