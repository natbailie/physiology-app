// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Paywall } from './Paywall';

afterEach(cleanup);

describe('paywall', () => {
  it('names the module the learner reached for', () => {
    render(<Paywall moduleId="shockStates" />);
    expect(screen.queryByText(/Shock/i)).toBeTruthy();
  });

  it('offers a way forward rather than a dead end', () => {
    render(<Paywall moduleId="shockStates" />);
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).toContain('#pricing');
    expect(links).toContain('#');
  });

  it('points at the modules the learner can already open', () => {
    render(<Paywall moduleId="shockStates" />);
    const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(links).toContain('#cardiorenal');
  });
});
