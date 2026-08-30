// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

/**
 * Configured-ness and signed-in-ness are whatever this mock says, never what a developer's
 * .env.local holds — the hazard `AuthContext.test.tsx` documents. Both are exactly what this
 * component branches on, so getting them from the environment would make the test meaningless.
 */
const mockState = vi.hoisted(() => ({
  configured: true,
  user: { id: 'u1', email: 'learner@example.com' } as { id: string; email: string } | null,
}));

vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mockState.configured;
  },
  supabase: null,
}));

vi.mock('@/auth/AuthContext', () => ({
  useAuthOptional: () => ({ user: mockState.user }),
}));

import { ChatLauncher } from './ChatLauncher';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  mockState.configured = true;
  mockState.user = { id: 'u1', email: 'learner@example.com' };
});

describe('ChatLauncher in production', () => {
  // DEV is on under vitest, so the production gate has to be stubbed off or these would assert a
  // branch the test runner never enters.
  it('stands aside entirely when there is no backend', () => {
    // Any build shipped without Supabase credentials. The edge function is what caps the shared
    // free-tier quota, and an anonymous caller cannot be capped.
    vi.stubEnv('DEV', false);
    mockState.configured = false;
    const { container } = render(<ChatLauncher route="home" />);
    expect(container.firstChild).toBeNull();
  });

  it('stands aside for a learner who is not signed in', () => {
    vi.stubEnv('DEV', false);
    mockState.user = null;
    const { container } = render(<ChatLauncher route="home" />);
    expect(container.firstChild).toBeNull();
  });

  it('offers the tutor to a signed-in learner', () => {
    vi.stubEnv('DEV', false);
    render(<ChatLauncher route="home" />);
    const launcher = screen.getByRole('button', { name: 'Ask the tutor' });
    expect(launcher.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('ChatLauncher in development', () => {
  it('offers the tutor with no backend and nobody signed in', () => {
    // The dev server answers the tutor itself, so requiring a Supabase session locally would
    // reintroduce the very deploy dependency the dev route removes.
    vi.stubEnv('DEV', true);
    mockState.configured = false;
    mockState.user = null;

    render(<ChatLauncher route="home" />);

    expect(screen.getByRole('button', { name: 'Ask the tutor' })).toBeTruthy();
  });
});
