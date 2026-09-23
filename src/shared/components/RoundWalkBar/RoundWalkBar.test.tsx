// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RoundWalkBar } from './RoundWalkBar';
import type { RoundBed } from '@/home/useRound';
import type { RoundWalk } from '@/shared/hooks/useRoundWalk';

afterEach(cleanup);

function neighbour(id: string, moduleId = 'cardiorenal'): RoundBed {
  return {
    id,
    moduleId,
    name: id,
    age: 61,
    oneLiner: 'Next on the round.',
    questionIds: ['q'],
    acuity: 'newAdmission',
    dueCount: 0,
    moduleName: 'Cardiorenal',
    unlocked: true,
  };
}

const WALK: RoundWalk = { previous: neighbour('Zoe'), next: neighbour('Bob'), position: 2, total: 5 };

describe('RoundWalkBar', () => {
  it('names the patients either side, not "previous" and "next"', () => {
    render(<RoundWalkBar walk={WALK} />);
    expect(screen.getByRole('link', { name: /Zoe/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Bob/ })).toBeTruthy();
    expect(screen.getByText('2 of 5')).toBeTruthy();
  });

  it('addresses each patient by their own URL, so back and new-tab keep working', () => {
    render(<RoundWalkBar walk={WALK} />);
    expect(screen.getByRole('link', { name: /Bob/ }).getAttribute('href')).toBe('#cardiorenal?case=Bob');
  });

  it('crosses modules, because a ward round is not one organ system', () => {
    const walk: RoundWalk = { ...WALK, next: neighbour('Ann', 'shockStates') };
    render(<RoundWalkBar walk={walk} />);
    expect(screen.getByRole('link', { name: /Ann/ }).getAttribute('href')).toBe('#shockStates?case=Ann');
  });

  it('says where the round ends rather than dropping the control', () => {
    render(<RoundWalkBar walk={{ previous: null, next: neighbour('Bob'), position: 1, total: 2 }} />);
    expect(screen.getByText('First on the round')).toBeTruthy();
  });

  it('renders nothing for a patient who is not on the round', () => {
    const { container } = render(
      <RoundWalkBar walk={{ previous: null, next: null, position: null, total: 0 }} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
