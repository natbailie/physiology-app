// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SimControls } from './SimControls';
import type { SimBaseline, SimTransport } from '@/shared/hooks/useEngineLoop';

// vitest runs with `globals: false`, so Testing Library's automatic cleanup is never
// registered — without this, each render stacks up in the same document.
afterEach(cleanup);

function makeTransport(overrides: Partial<SimTransport> = {}): SimTransport {
  return {
    playing: true,
    speed: 1,
    play: vi.fn(),
    pause: vi.fn(),
    toggle: vi.fn(),
    stepOnce: vi.fn(),
    setSpeed: vi.fn(),
    ...overrides,
  };
}

function makeBaseline(overrides: Partial<SimBaseline<unknown>> = {}): SimBaseline<unknown> {
  return { history: null, capture: vi.fn(), clear: vi.fn(), ...overrides };
}

describe('SimControls', () => {
  it('offers Pause while running and Play while paused', () => {
    const { rerender } = render(<SimControls transport={makeTransport({ playing: true })} />);
    expect(screen.getByRole('button', { name: 'Pause simulation' })).toBeTruthy();

    rerender(<SimControls transport={makeTransport({ playing: false })} />);
    expect(screen.getByRole('button', { name: 'Play simulation' })).toBeTruthy();
  });

  it('toggles playback when the play button is pressed', () => {
    const toggle = vi.fn();
    render(<SimControls transport={makeTransport({ toggle })} />);

    screen.getByRole('button', { name: 'Pause simulation' }).click();
    expect(toggle).toHaveBeenCalledOnce();
  });

  it('disables Step while playing, because stepping only means something when paused', () => {
    render(<SimControls transport={makeTransport({ playing: true })} />);
    expect((screen.getByRole('button', { name: 'Step' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('enables Step once paused and forwards the press', () => {
    const stepOnce = vi.fn();
    render(<SimControls transport={makeTransport({ playing: false, stepOnce })} />);

    const step = screen.getByRole('button', { name: 'Step' }) as HTMLButtonElement;
    expect(step.disabled).toBe(false);
    step.click();
    expect(stepOnce).toHaveBeenCalledOnce();
  });

  it('marks only the active speed as pressed', () => {
    render(<SimControls transport={makeTransport({ speed: 2 })} />);

    expect(screen.getByRole('button', { name: '2x' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '1x' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('reports the chosen speed', () => {
    const setSpeed = vi.fn();
    render(<SimControls transport={makeTransport({ setSpeed })} />);

    screen.getByRole('button', { name: '0.25x' }).click();
    expect(setSpeed).toHaveBeenCalledWith(0.25);
  });

  it('hides the baseline control when the module does not supply one', () => {
    render(<SimControls transport={makeTransport()} />);
    expect(screen.queryByRole('button', { name: /baseline/i })).toBeNull();
  });

  it('captures a baseline when none is frozen, and clears it when one is', () => {
    const capture = vi.fn();
    const clear = vi.fn();

    const { rerender } = render(
      <SimControls transport={makeTransport()} baseline={makeBaseline({ capture, clear })} />,
    );
    screen.getByRole('button', { name: 'Freeze baseline' }).click();
    expect(capture).toHaveBeenCalledOnce();
    expect(clear).not.toHaveBeenCalled();

    rerender(
      <SimControls transport={makeTransport()} baseline={makeBaseline({ history: [1, 2], capture, clear })} />,
    );
    screen.getByRole('button', { name: 'Clear baseline' }).click();
    expect(clear).toHaveBeenCalledOnce();
  });
});
