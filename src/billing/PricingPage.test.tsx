// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  status: 'free' as 'loading' | 'free' | 'active',
  source: 'none' as 'institution' | 'subscription' | 'none',
  institutionName: null as string | null,
}));

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ user: state.user }),
}));

vi.mock('./useEntitlement', () => ({
  useEntitlement: () => ({
    status: state.status,
    source: state.source,
    institutionName: state.institutionName,
    isUnlocked: () => state.status === 'active',
  }),
}));

const rc = vi.hoisted(() => ({
  offered: null as unknown,
  checkout: { ok: true } as unknown,
  checkoutCalls: [] as unknown[],
}));

vi.mock('./revenuecat', () => ({
  fetchOfferedPackages: async () => rc.offered,
}));

vi.mock('./startCheckout', () => ({
  startCheckout: async (...args: unknown[]) => {
    rc.checkoutCalls.push(args);
    return rc.checkout;
  },
}));

const licence = vi.hoisted(() => ({
  result: { ok: false, message: 'That code was not recognised.' } as unknown,
  codes: [] as string[],
}));

vi.mock('./licence', () => ({
  redeemLicence: async (code: string) => {
    licence.codes.push(code);
    return licence.result;
  },
}));

import { PricingPage } from './PricingPage';

/** What a live RevenueCat offering looks like once mapped: the fallback shape plus a buyable
 * package. Without one there is nothing to purchase, which is its own test below. */
const LIVE_OFFERING = [
  { id: '$rc_monthly', label: 'Monthly', price: '£10', period: 'month', rcPackage: { identifier: '$rc_monthly' } },
  {
    id: '$rc_annual',
    label: 'Annual',
    price: '£60',
    period: 'year',
    note: 'Two months free',
    rcPackage: { identifier: '$rc_annual' },
  },
];

afterEach(() => {
  cleanup();
  state.user = null;
  state.status = 'free';
  state.source = 'none';
  state.institutionName = null;
  rc.offered = null;
  rc.checkout = { ok: true };
  rc.checkoutCalls = [];
  licence.result = { ok: false, message: 'That code was not recognised.' };
  licence.codes = [];
});

describe('pricing page', () => {
  it('asks a signed-out visitor to create an account before selling to them', () => {
    render(<PricingPage />);
    expect(screen.queryByRole('button', { name: /subscribe/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /create a free account/i })).toBeTruthy();
  });

  it('offers both billing periods, defaulting to the annual one', () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    render(<PricingPage />);

    expect(screen.getByRole('radio', { name: /monthly/i })).toBeTruthy();
    const annual = screen.getByRole('radio', { name: /annual/i }) as HTMLInputElement;
    expect(annual.checked).toBe(true);
    expect(screen.getByRole('button', { name: /subscribe.*year/i })).toBeTruthy();
  });

  it('switches the call to action when the learner picks monthly', () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    render(<PricingPage />);

    fireEvent.click(screen.getByRole('radio', { name: /monthly/i }));
    expect(screen.getByRole('button', { name: /subscribe.*month/i })).toBeTruthy();
  });

  it('still prices the plan when RevenueCat answers with nothing', () => {
    // Unconfigured, offline, or no current offering. A pricing page showing no price is worse than
    // one showing the last known one.
    state.user = { id: 'u1', email: 'a@b.c' };
    render(<PricingPage />);
    expect(screen.getByText('£55')).toBeTruthy();
    expect(screen.getByText('£9')).toBeTruthy();
  });

  it('prefers the dashboard’s prices over the fallback once the offering lands', async () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    rc.offered = LIVE_OFFERING;
    render(<PricingPage />);

    await waitFor(() => expect(screen.queryByText('£60')).toBeTruthy());
    expect(screen.queryByText('£55')).toBeNull();
  });

  it('says nothing to sell to someone who already has full access', () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    state.status = 'active';
    state.source = 'subscription';
    render(<PricingPage />);
    expect(screen.queryByRole('button', { name: /subscribe/i })).toBeNull();
    expect(screen.queryByText(/already have full access/i)).toBeTruthy();
  });

  it('tells a learner on a school licence not to pay us twice', () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    state.status = 'active';
    state.source = 'institution';
    state.institutionName = 'Barts and The London';
    render(<PricingPage />);

    expect(screen.getByText(/Barts and The London/)).toBeTruthy();
    expect(screen.getByText(/cancel it/i)).toBeTruthy();
    // Nothing left to redeem, so the side door closes.
    expect(screen.queryByLabelText(/given you a code/i)).toBeNull();
  });

  it('refuses to pretend it can sell anything when no offering came back', async () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    render(<PricingPage />);

    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));
    await waitFor(() => expect(screen.queryByText(/not configured/i)).toBeTruthy());
    expect(rc.checkoutCalls).toEqual([]);
  });

  it('buys the package the learner actually chose', async () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    rc.offered = LIVE_OFFERING;
    render(<PricingPage />);

    await waitFor(() => expect(screen.queryByText('£60')).toBeTruthy());
    fireEvent.click(screen.getByRole('radio', { name: /monthly/i }));
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    await waitFor(() => expect(rc.checkoutCalls.length).toBe(1));
    // The user id is the RevenueCat App User ID, which is what ties the webhook to the profile.
    expect(rc.checkoutCalls[0]).toEqual(['u1', { identifier: '$rc_monthly' }, 'a@b.c']);
  });

  it('says nothing when the learner closes the payment sheet — that is a decision, not an error', async () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    rc.offered = LIVE_OFFERING;
    rc.checkout = { cancelled: true };
    render(<PricingPage />);

    await waitFor(() => expect(screen.queryByText('£60')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));
    await waitFor(() => expect(rc.checkoutCalls.length).toBe(1));
    expect(screen.queryByText(/could not/i)).toBeNull();
  });

  it('surfaces a failed payment rather than throwing', async () => {
    state.user = { id: 'u1', email: 'a@b.c' };
    rc.offered = LIVE_OFFERING;
    rc.checkout = { ok: false, message: 'Your card was declined.' };
    render(<PricingPage />);

    await waitFor(() => expect(screen.queryByText('£60')).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));
    await waitFor(() => expect(screen.queryByText(/card was declined/i)).toBeTruthy());
  });

  it('redeems a licence code and names the institution back', async () => {
    licence.result = { ok: true, institutionName: 'Barts and The London', expiresAt: null };
    render(<PricingPage />);

    fireEvent.change(screen.getByLabelText(/given you a code/i), { target: { value: 'QRSTUVWXYZ' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    await waitFor(() => expect(screen.queryByText(/Access granted through Barts/)).toBeTruthy());
    expect(licence.codes).toEqual(['QRSTUVWXYZ']);
  });

  it('reports a rejected code without claiming anything was unlocked', async () => {
    render(<PricingPage />);

    fireEvent.change(screen.getByLabelText(/given you a code/i), { target: { value: 'WRONGCODE1' } });
    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    await waitFor(() => expect(screen.queryByText(/not recognised/i)).toBeTruthy());
  });
});
