// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { DisciplineCard } from './DisciplineCard';

afterEach(cleanup);

describe('DisciplineCard', () => {
  it('links an available subject at its target, with its count', () => {
    render(
      <DisciplineCard
        id="physiology"
        name="Physiology"
        blurb="The simulators."
        status="available"
        href="#discipline/physiology"
        countText="47 simulators"
      />,
    );
    const link = screen.getByRole('link', { name: /Physiology/ });
    expect(link.getAttribute('href')).toBe('#discipline/physiology');
    expect(screen.getByText('47 simulators')).toBeTruthy();
  });

  it('renders an unbuilt subject as a disabled tile, not a link', () => {
    render(
      <DisciplineCard
        id="anatomy"
        name="Anatomy"
        blurb="Structure."
        status="comingSoon"
        countText="0 simulators"
      />,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Coming soon')).toBeTruthy();
    expect(screen.getByText('Anatomy').closest('[aria-disabled="true"]')).toBeTruthy();
  });
});
