// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RoundBoard } from './RoundBoard';
import { clearSpecialtyFilterForTests, setSpecialtyFilter } from './specialtyFilter';
import type { Round, RoundBed } from './useRound';

afterEach(() => {
  cleanup();
  clearSpecialtyFilterForTests();
});

function bed(id: string, overrides: Partial<RoundBed> = {}): RoundBed {
  return {
    id,
    moduleId: 'shockStates',
    name: id,
    age: 40,
    oneLiner: 'A presenting complaint.',
    questionIds: ['q'],
    acuity: 'newAdmission',
    dueCount: 0,
    moduleName: 'Shock States',
    unlocked: true,
    ...overrides,
  };
}

function round(
  today: RoundBed[],
  rest: RoundBed[],
  referrals: RoundBed[] = [],
  everySpecialty: Round['everySpecialty'] = [],
): Round {
  return {
    beds: [...today, ...rest],
    today,
    rest,
    referrals,
    everySpecialty,
    ready: true,
  };
}

describe('RoundBoard', () => {
  it('shows today’s slice with the rest one press away', () => {
    const r = round([bed('Ann'), bed('Bob')], [bed('Cat')]);
    render(<RoundBoard round={r} />);
    expect(screen.getByRole('link', { name: /Ann/ })).toBeDefined();
    expect(screen.queryByRole('link', { name: /Cat/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Show all 3/ }));
    expect(screen.getByRole('link', { name: /Cat/ })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Back to today/ }));
    expect(screen.queryByRole('link', { name: /Cat/ })).toBeNull();
  });

  it('offers no expander when the ward fits', () => {
    render(<RoundBoard round={round([bed('Ann')], [])} />);
    expect(screen.queryByRole('button', { name: /Show all/ })).toBeNull();
  });

  it('opens the round on the top of the board, not on the alphabetical first bed', () => {
    // `todaysRound` puts crash and due first and shuffles the rest per day, so the board's
    // own order is the honest starting point — `beds[0]` would hand back the same name daily.
    const r = round([bed('Zoe', { acuity: 'crash', moduleId: 'respiratory' })], [bed('Ann')]);
    render(<RoundBoard round={r} />);
    const start = screen.getByRole('link', { name: /Start round/ });
    expect(start.getAttribute('href')).toBe('#respiratory?case=Zoe');
  });

  it('counts the whole ward in the action, not today’s slice', () => {
    render(<RoundBoard round={round([bed('Ann'), bed('Bob')], [bed('Cat')])} />);
    expect(screen.getByRole('link', { name: /^Start round\s+3 patients$/ })).toBeTruthy();
  });

  it('says patient, singular, for a ward of one', () => {
    render(<RoundBoard round={round([bed('Ann')], [])} />);
    expect(screen.getByRole('link', { name: /^Start round\s+1 patient$/ })).toBeTruthy();
  });

  it('offers a specialty chip per ward, from the UNFILTERED round', () => {
    // Built from `everySpecialty`, not from the beds on screen — otherwise choosing one would
    // leave a row holding only that specialty and no way back to the others.
    setSpecialtyFilter('respiratory');
    render(
      <RoundBoard round={round([bed('Ann')], [], [], ['cardiovascular', 'respiratory'])} />,
    );
    expect(screen.getByRole('button', { name: 'Cardiovascular' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Respiratory' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('shows no chip row for a single-specialty ward, where it would filter nothing', () => {
    render(<RoundBoard round={round([bed('Ann')], [], [], ['respiratory'])} />);
    expect(screen.queryByRole('group', { name: /specialty/i })).toBeNull();
  });

  it('says a filtered ward is empty rather than rendering a bare chip row', () => {
    const referrals = [bed('Zed', { unlocked: false })];
    render(<RoundBoard round={round([], [], referrals, ['cardiovascular', 'respiratory'])} />);
    expect(screen.getByText(/No patients on this ward/)).toBeTruthy();
  });

  it('offers no action when every patient is a referral', () => {
    // A locked module holds no review state, so there is no bed to start on.
    render(<RoundBoard round={round([], [], [bed('Ann', { unlocked: false })])} />);
    expect(screen.queryByRole('link', { name: /Start round/ })).toBeNull();
  });

  it('keeps the referral line pointed at pricing, naming a short ward', () => {
    const referrals = [bed('Ann', { unlocked: false }), bed('Bob', { unlocked: false })];
    render(<RoundBoard round={round([bed('Cat')], [], referrals)} />);
    const link = screen.getByRole('link', { name: /See who/ });
    expect(link.getAttribute('href')).toBe('#pricing');
    expect(screen.getByText(/Ann, Bob/)).toBeTruthy();
  });
});
