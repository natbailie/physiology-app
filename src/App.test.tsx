// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

/** Same guard as AuthGate.test.tsx: vitest loads .env files, so an unmocked run would
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

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => authState.value,
  useAuthOptional: () => authState.value,
}));

import App from './App';

afterEach(() => {
  cleanup();
  window.location.hash = '';
  mockState.configured = false;
  authState.value = { user: null, initialising: false };
});

describe('app shell landmarks', () => {
  it('renders a single main landmark with a skip link targeting it', async () => {
    // The review paper, not home: the shell is identical on every route, and home's
    // ward-round tree pulls every case file — imports that outlive the test's jsdom
    // and fail the run at teardown rather than in any assertion.
    window.location.hash = '#review-h';
    render(<App />);
    // Flush the route's lazy chunk before asserting, for the same teardown reason.
    await screen.findByRole('heading', { name: /accessibility review/i });
    const main = screen.getByRole('main');
    expect(main.getAttribute('id')).toBe('main');
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip.getAttribute('href')).toBe('#main');
    // The skip link is the first tab stop: ahead of the main landmark in DOM order.
    expect(skip.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps the landmark pair on the signed-out landing screen', () => {
    // The gate short-circuits to LandingPage past sign-in; the skip link and main live
    // above it, so the first screen every visitor sees still passes 2.4.1.
    mockState.configured = true;
    window.location.hash = '#shockStates';
    render(<App />);
    const main = screen.getByRole('main');
    expect(main.getAttribute('id')).toBe('main');
    expect(main.textContent).toMatch(/Physiology Lab/);
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('skips to the content without navigating away', async () => {
    // The app routes on the hash, so a plain `href="#main"` used to resolve as an unknown route
    // and send the learner to the home page instead of past the header.
    window.location.hash = '#review-h';
    render(<App />);
    await screen.findByRole('heading', { name: /accessibility review/i });
    fireEvent.click(screen.getByRole('link', { name: /skip to main content/i }));
    expect(window.location.hash).toBe('#review-h');
    expect(document.activeElement).toBe(screen.getByRole('main'));
  });

  it('titles the page after the route', async () => {
    window.location.hash = '#review-h';
    render(<App />);
    await screen.findByRole('heading', { name: /accessibility review/i });
    expect(document.title).toBe('Accessibility review — Physiology Lab');
  });

  it('carries every legal document in a footer, even signed out', () => {
    mockState.configured = true;
    window.location.hash = '#shockStates';
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    const links = within(footer)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'));
    for (const route of ['#privacy', '#terms', '#cookies', '#refunds', '#accessibility', '#business', '#reviews']) {
      expect(links).toContain(route);
    }
    expect(within(footer).getByRole('button', { name: /cookie settings/i })).toBeTruthy();
    // Outside <main>: a footer inside the main landmark is not a contentinfo landmark.
    expect(screen.getByRole('main').contains(footer)).toBe(false);
  });
});
