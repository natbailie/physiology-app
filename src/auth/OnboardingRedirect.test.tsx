// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string; onboarded: boolean } | null,
  markOnboarded: vi.fn(async () => {}),
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: state.user, markOnboarded: state.markOnboarded }),
}));

import { OnboardingRedirect } from './OnboardingRedirect';

afterEach(() => {
  cleanup();
  state.markOnboarded.mockClear();
  window.location.hash = '';
});

describe('onboarding redirect', () => {
  it('sends a not-yet-onboarded user to the plans page once', () => {
    state.user = { id: 'u1', email: 'a@b.ac.uk', onboarded: false };
    const { rerender } = render(<OnboardingRedirect />);
    expect(window.location.hash).toBe('#pricing');
    rerender(<OnboardingRedirect />);
    expect(state.markOnboarded).toHaveBeenCalledTimes(1);
  });

  it('leaves an onboarded user where they are', () => {
    state.user = { id: 'u1', email: 'a@b.ac.uk', onboarded: true };
    window.location.hash = '#home';
    render(<OnboardingRedirect />);
    expect(window.location.hash).toBe('#home');
    expect(state.markOnboarded).not.toHaveBeenCalled();
  });
});
