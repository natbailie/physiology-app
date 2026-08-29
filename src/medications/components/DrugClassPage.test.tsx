// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DrugClassPage } from './DrugClassPage';
import { getDrugClass } from '../drugs';

afterEach(cleanup);

describe('DrugClassPage', () => {
  it('renders the class, its example drugs and its mechanism', () => {
    const drug = getDrugClass('beta-blockers')!;
    render(<DrugClassPage drug={drug} />);
    expect(screen.getByRole('heading', { name: 'Beta-blockers' })).toBeTruthy();
    expect(screen.getByText('Bisoprolol')).toBeTruthy();
    expect(screen.getByText(/blocking beta-1 receptors/i)).toBeTruthy();
  });

  it('shows a "watch it happen" link when the class maps to a simulator module', () => {
    const drug = getDrugClass('nitrates')!;
    render(<DrugClassPage drug={drug} />);
    const link = screen.getByRole('link', { name: /watch this happen/i });
    expect(link.getAttribute('href')).toBe('#coronaryCirculation');
  });

  it('renders no simulator link for a class with no mapped engine', () => {
    const drug = getDrugClass('emollients')!;
    render(<DrugClassPage drug={drug} />);
    expect(screen.queryByRole('link', { name: /watch this happen/i })).toBeNull();
  });

  it('embeds an interactive mechanism diagram for classes that have one', () => {
    const drug = getDrugClass('proton-pump-inhibitors')!;
    render(<DrugClassPage drug={drug} />);
    expect(screen.getByRole('img', { name: /stomach/i })).toBeTruthy();
    expect(screen.getByLabelText('PPI dose')).toBeTruthy();
  });

  it('renders no mechanism diagram for a class without one', () => {
    const drug = getDrugClass('emollients')!;
    render(<DrugClassPage drug={drug} />);
    expect(screen.queryByLabelText('PPI dose')).toBeNull();
  });
});
