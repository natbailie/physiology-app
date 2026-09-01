// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DisciplinePage } from './DisciplinePage';

afterEach(cleanup);

describe('DisciplinePage', () => {
  it('shows the subject title and links back to the picker', () => {
    render(<DisciplinePage disciplineId="physiology" />);
    expect(screen.getByRole('heading', { name: 'Physiology' })).toBeTruthy();
    const back = screen.getByRole('link', { name: /All subjects/i });
    expect(back.getAttribute('href')).toBe('#home');
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
