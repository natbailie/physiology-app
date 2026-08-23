// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * Whether Supabase is "configured" is whatever this mock says — never what a developer's
 * .env.local happens to contain. Vitest loads env files, so without the mock these tests
 * would silently take the network path on any machine with real credentials.
 */
const mockState = vi.hoisted(() => ({
  configured: false,
  client: null as unknown,
}));

vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mockState.configured;
  },
  get supabase() {
    return mockState.client;
  },
}));

import { AuthProvider, useAuth } from './AuthContext';

afterEach(() => {
  cleanup();
  mockState.configured = false;
  mockState.client = null;
});

type AuthOverrides = {
  getSession?: () => Promise<unknown>;
  signUp?: () => Promise<unknown>;
  signInWithPassword?: () => Promise<unknown>;
  signOut?: () => Promise<unknown>;
};

function fakeSupabase(overrides: AuthOverrides = {}) {
  return {
    auth: {
      getSession: overrides.getSession ?? (async () => ({ data: { session: null } })),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signUp:
        overrides.signUp ??
        (async () => ({ data: { user: null, session: null }, error: null })),
      signInWithPassword:
        overrides.signInWithPassword ?? (async () => ({ data: {}, error: null })),
      signOut: overrides.signOut ?? (async () => ({})),
    },
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('auth context when Supabase is not configured', () => {
  it('starts signed out and finishes initialising immediately', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.initialising).toBe(false);
  });

  it('answers sign-in attempts with an honest message instead of throwing', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const outcome = await result.current.signIn('student@example.com', 'password');
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.message).toContain('not configured');
  });

  it('answers sign-up attempts the same way', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const outcome = await result.current.signUp('student@example.com', 'password');
    expect(outcome.ok).toBe(false);
  });
});

describe('auth context with a live client', () => {
  it('picks up an existing session and reports signed-in once initialisation settles', async () => {
    mockState.configured = true;
    mockState.client = fakeSupabase({
      getSession: async () => ({
        data: { session: { user: { id: 'u7', email: 'student@med.ac.uk' } } },
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.initialising).toBe(false));
    expect(result.current.user).toEqual({ id: 'u7', email: 'student@med.ac.uk' });
  });

  it('translates credential failures into learner-speak', async () => {
    mockState.configured = true;
    mockState.client = fakeSupabase({
      signInWithPassword: async () => ({
        data: {},
        error: { message: 'Invalid login credentials' },
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    const outcome = await result.current.signIn('student@example.com', 'wrong');
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.message).toContain('do not match');
  });

  it('flags the check-your-inbox state when sign-up returns a user but no session', async () => {
    mockState.configured = true;
    mockState.client = fakeSupabase({
      signUp: async () => ({
        data: { session: null, user: { id: 'new-1' } },
        error: null,
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    const outcome = await result.current.signUp('student@example.com', 'password');
    expect(outcome).toEqual({ ok: true, needsConfirmation: true });
  });

  it('signs out through the client', async () => {
    let signOutCalled = false;
    mockState.configured = true;
    mockState.client = fakeSupabase({
      signOut: async () => {
        signOutCalled = true;
        return {};
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await result.current.signOut();
    expect(signOutCalled).toBe(true);
  });
});
