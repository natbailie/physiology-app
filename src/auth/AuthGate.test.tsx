// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

/** Same guard as AuthContext.test.tsx: vitest loads .env files, so an unmocked run would
 * silently take the network path on any machine with real credentials. */
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

const authState = vi.hoisted(() => ({
  value: { user: null as { id: string; email: string } | null, initialising: false },
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => authState.value,
}));

import { AuthGate } from './AuthGate';

afterEach(() => {
  cleanup();
  mockState.configured = false;
  authState.value = { user: null, initialising: false };
});

function renderGate(route = 'shockStates') {
  return render(
    <AuthGate route={route as never}>
      <p>the module grid</p>
    </AuthGate>,
  );
}

describe('auth gate', () => {
  it('stands aside entirely when Supabase is not configured', () => {
    renderGate();
    expect(screen.queryByText('the module grid')).toBeTruthy();
  });

  it('shows the landing screen and nothing else to a signed-out visitor', () => {
    mockState.configured = true;
    renderGate();
    expect(screen.queryByText('the module grid')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Physiology Lab' })).toBeTruthy();
  });

  it.each([
    ['pricing', 'the pricing page'],
    ['accessibility', 'the accessibility statement'],
    ['review-h', 'the accessibility review'],
  ])('lets a signed-out visitor read %s', (route, text) => {
    mockState.configured = true;
    render(
      <AuthGate route={route as never}>
        <p>{text}</p>
      </AuthGate>,
    );
    expect(screen.queryByText(text)).toBeTruthy();
  });

  it('shows neither while the session lookup is still in flight', () => {
    mockState.configured = true;
    authState.value = { user: null, initialising: true };
    renderGate();
    expect(screen.queryByText('the module grid')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Physiology Lab' })).toBeNull();
  });

  it('renders the app once there is a session', () => {
    mockState.configured = true;
    authState.value = { user: { id: 'u1', email: 'student@med.ac.uk' }, initialising: false };
    renderGate();
    expect(screen.queryByText('the module grid')).toBeTruthy();
  });
});
