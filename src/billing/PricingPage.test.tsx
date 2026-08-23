// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  status: 'free' as 'loading' | 'free' | 'active',
}));

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: state.user }),
}));

vi.mock('./useEntitlement', () => ({
  useEntitlement: () => ({
    status: state.status,
    isUnlocked: () => state.status === 'active',
  }),
}));

import { PricingPage } from './PricingPage';

afterEach(() => {
  cleanup();
  state.user = null;
  state.status = 'free';
});

describe('pricing page', () => {
  it('asks a signed-out visitor to create an account before selling to them', () => {
    render(<PricingPage />);
    expect(screen.queryByRole('button', { name: /subscribe/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /create a free account/i })).toBeTruthy();
  });

  it('says nothing to sell to someone who already has full access', () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    state.status = 'active';
    render(<PricingPage />);
    expect(screen.queryByRole('button', { name: /subscribe/i })).toBeNull();
    expect(screen.queryByText(/already have full access/i)).toBeTruthy();
  });

  it('surfaces the not-live-yet message rather than throwing when a free user subscribes', async () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    render(<PricingPage />);
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));
    await waitFor(() => expect(screen.queryByText(/not live yet/i)).toBeTruthy());
  });
});
