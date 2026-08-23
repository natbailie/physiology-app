// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';

/** As in AuthContext.test.tsx: what Supabase returns is whatever this mock says, never .env.local. */
const mockState = vi.hoisted(() => ({
  configured: true,
  profileRow: null as unknown,
  profileError: null as unknown,
}));

vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mockState.configured;
  },
  get supabase() {
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: mockState.profileRow, error: mockState.profileError }),
          }),
        }),
      }),
    };
  },
}));

const authState = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
}));

vi.mock('@/auth/AuthContext', () => ({
  useAuthOptional: () => ({ user: authState.user }),
}));

import { clearEntitlementCache, useEntitlement } from './useEntitlement';

afterEach(() => {
  cleanup();
  clearEntitlementCache();
  mockState.configured = true;
  mockState.profileRow = null;
  mockState.profileError = null;
  authState.user = null;
});

describe('entitlement', () => {
  it('gives an unsubscribed learner exactly the free set', async () => {
    authState.user = { id: 'u1', email: 'a@b.c' };
    mockState.profileRow = { subscription_status: 'free' };

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('free'));

    expect(result.current.isUnlocked('cardiorenal')).toBe(true);
    expect(result.current.isUnlocked('reference')).toBe(true);
    expect(result.current.isUnlocked('shockStates')).toBe(false);
  });

  it('opens everything for an active subscriber', async () => {
    authState.user = { id: 'u2', email: 'a@b.c' };
    mockState.profileRow = { subscription_status: 'active' };

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('active'));
    expect(result.current.isUnlocked('shockStates')).toBe(true);
  });

  it('counts a Stripe trial as full access', async () => {
    authState.user = { id: 'u3', email: 'a@b.c' };
    mockState.profileRow = { subscription_status: 'trialing' };

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('active'));
  });

  it('falls closed when the lookup fails — a blip must not hand out the catalogue', async () => {
    authState.user = { id: 'u4', email: 'a@b.c' };
    mockState.profileError = { message: 'network down' };

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('free'));
    expect(result.current.isUnlocked('shockStates')).toBe(false);
  });

  it('unlocks everything when there is no Supabase to sell a subscription through', () => {
    mockState.configured = false;
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.status).toBe('active');
    expect(result.current.isUnlocked('shockStates')).toBe(true);
  });
});
