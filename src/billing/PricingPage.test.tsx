// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  status: 'free' as 'loading' | 'free' | 'active',
  viaAccessCode: false,
}));

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: state.user }),
}));

vi.mock('./useEntitlement', () => ({
  useEntitlement: () => ({
    status: state.status,
    viaAccessCode: state.viaAccessCode,
    isUnlocked: () => state.status === 'active',
  }),
}));

import { TEST_ACCESS_CODE } from './config';
import { clearAccessCode, hasRedeemedAccessCode } from './accessCode';
import { PricingPage } from './PricingPage';

afterEach(() => {
  cleanup();
  state.user = null;
  state.status = 'free';
  state.viaAccessCode = false;
  clearAccessCode();
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

  it('accepts the access code and stores the unlock', () => {
    render(<PricingPage />);
    fireEvent.change(screen.getByLabelText(/have an access code/i), {
      target: { value: TEST_ACCESS_CODE },
    });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(hasRedeemedAccessCode()).toBe(true);
  });

  it('rejects a wrong code without unlocking anything', () => {
    render(<PricingPage />);
    fireEvent.change(screen.getByLabelText(/have an access code/i), {
      target: { value: 'mbbs0000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));
    expect(screen.queryByText(/not recognised/i)).toBeTruthy();
    expect(hasRedeemedAccessCode()).toBe(false);
  });

  it('offers a way back to the paywall once a code is in use', () => {
    state.status = 'active';
    state.viaAccessCode = true;
    render(<PricingPage />);
    expect(screen.queryByText(/unlocked with an access code/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /remove/i })).toBeTruthy();
    expect(screen.queryByLabelText(/have an access code/i)).toBeNull();
  });
});