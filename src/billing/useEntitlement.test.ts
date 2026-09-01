// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';

/** As in AuthContext.test.tsx: what Supabase returns is whatever this mock says, never .env.local. */
const mockState = vi.hoisted(() => ({
  configured: true,
  entitlementRow: null as unknown,
  entitlementError: null as unknown,
  /** Every table read, so a test can assert we ask the VIEW rather than the profiles table. */
  reads: [] as string[],
}));

vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return mockState.configured;
  },
  get supabase() {
    return {
      from: (table: string) => {
        mockState.reads.push(table);
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: mockState.entitlementRow,
                error: mockState.entitlementError,
              }),
            }),
          }),
        };
      },
    };
  },
}));

const authState = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
}));

vi.mock('@/auth/AuthContext', () => ({
  useAuthOptional: () => ({ user: authState.user }),
}));

import { clearEntitlementCache, confirmSubscription, invalidateEntitlement, useEntitlement } from './useEntitlement';

const free = { status: 'free', source: 'none', institution_name: null };
const subscribed = { status: 'active', source: 'subscription', institution_name: null };
const seated = { status: 'active', source: 'institution', institution_name: 'King’s College London' };

afterEach(() => {
  cleanup();
  clearEntitlementCache();
  mockState.configured = true;
  mockState.entitlementRow = null;
  mockState.entitlementError = null;
  mockState.reads = [];
  authState.user = null;
});

describe('entitlement', () => {
  it('gives an unsubscribed learner exactly the free set', async () => {
    authState.user = { id: 'u1', email: 'a@b.c' };
    mockState.entitlementRow = free;

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('free'));

    expect(result.current.isUnlocked('cardiorenal')).toBe(true);
    expect(result.current.isUnlocked('reference')).toBe(true);
    expect(result.current.isUnlocked('shockStates')).toBe(false);
  });

  it('resolves against the view, so the precedence rule stays in SQL', async () => {
    authState.user = { id: 'u2', email: 'a@b.c' };
    mockState.entitlementRow = subscribed;

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('active'));

    // Reading `profiles` here would mean the client had started resolving entitlement itself, and
    // an institutional seat would stop counting.
    expect(mockState.reads).toContain('v_entitlement');
    expect(mockState.reads).not.toContain('profiles');
  });

  it('opens everything for an active subscriber', async () => {
    authState.user = { id: 'u3', email: 'a@b.c' };
    mockState.entitlementRow = subscribed;

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('active'));
    expect(result.current.isUnlocked('shockStates')).toBe(true);
    expect(result.current.source).toBe('subscription');
  });

  it('opens everything for a learner on an institutional seat, and names the institution', async () => {
    authState.user = { id: 'u4', email: 'a@b.c' };
    mockState.entitlementRow = seated;

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('active'));
    expect(result.current.source).toBe('institution');
    expect(result.current.institutionName).toBe('King’s College London');
    expect(result.current.isUnlocked('shockStates')).toBe(true);
  });

  it('falls closed when the lookup fails — a blip must not hand out the catalogue', async () => {
    authState.user = { id: 'u5', email: 'a@b.c' };
    mockState.entitlementError = { message: 'network down' };

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('free'));
    expect(result.current.isUnlocked('shockStates')).toBe(false);
  });

  it('re-reads when something invalidates it, so redeeming a code unlocks the grid', async () => {
    authState.user = { id: 'u6', email: 'a@b.c' };
    mockState.entitlementRow = free;

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('free'));

    mockState.entitlementRow = seated;
    act(() => invalidateEntitlement());

    await waitFor(() => expect(result.current.status).toBe('active'));
    expect(result.current.source).toBe('institution');
  });

  it('unlocks everything when there is no Supabase to sell a subscription through', () => {
    mockState.configured = false;
    const { result } = renderHook(() => useEntitlement());
    expect(result.current.status).toBe('active');
    expect(result.current.isUnlocked('shockStates')).toBe(true);
  });
});

describe('confirming a purchase', () => {
  it('unlocks immediately rather than making a paying learner wait for the webhook', async () => {
    authState.user = { id: 'u7', email: 'a@b.c' };
    // The webhook has not landed: the server still says free.
    mockState.entitlementRow = free;

    const { result } = renderHook(() => useEntitlement());
    await waitFor(() => expect(result.current.status).toBe('free'));

    act(() => {
      void confirmSubscription('u7');
    });

    // No awaiting the poll: the grant is made before the first request goes out.
    await waitFor(() => expect(result.current.status).toBe('active'));
    expect(result.current.source).toBe('subscription');
  });

  it('replaces the optimistic grant with the server’s answer once the webhook lands', async () => {
    vi.useFakeTimers();
    authState.user = { id: 'u8', email: 'a@b.c' };
    mockState.entitlementRow = subscribed;

    const settled = confirmSubscription('u8');
    await vi.advanceTimersByTimeAsync(600);
    await expect(settled).resolves.toBe(true);
    vi.useRealTimers();
  });

  it('keeps access when the webhook never lands — the learner has already paid', async () => {
    vi.useFakeTimers();
    authState.user = { id: 'u9', email: 'a@b.c' };
    mockState.entitlementRow = free;

    const settled = confirmSubscription('u9');
    await vi.advanceTimersByTimeAsync(20_000);
    await expect(settled).resolves.toBe(false);
    vi.useRealTimers();

    const { result } = renderHook(() => useEntitlement());
    authState.user = { id: 'u9', email: 'a@b.c' };
    await waitFor(() => expect(result.current.status).toBe('active'));
  });
});
