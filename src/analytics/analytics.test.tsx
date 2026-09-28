// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/lib/env', () => ({ gaMeasurementId: 'G-TEST123', isDev: () => false }));

import { CookieBanner } from './CookieBanner';
import { decide, openCookieSettings, resetConsentForTests } from './consent';
import { clearGaCookies, installAnalytics, pagePath, resetAnalyticsForTests } from './ga';
import { CONSENT_STORAGE_KEY } from '@/shared/legal/cookies';

const gaScript = () => document.querySelector('script[data-analytics="ga4"]');

beforeEach(() => {
  localStorage.clear();
  document.head.innerHTML = '';
  delete window.gtag;
  delete window.dataLayer;
  resetAnalyticsForTests();
  resetConsentForTests();
});

afterEach(() => {
  cleanup();
  resetAnalyticsForTests();
});

describe('cookie consent', () => {
  it('asks before anything is loaded, with equal Accept and Reject buttons', () => {
    installAnalytics();
    render(<CookieBanner />);
    const accept = screen.getByRole('button', { name: 'Accept analytics' });
    const reject = screen.getByRole('button', { name: 'Reject analytics' });
    // Same class: equal prominence is the requirement, not a nicety.
    expect(accept.className).toBe(reject.className);
    expect(gaScript()).toBeNull();
    expect(window.gtag).toBeUndefined();
  });

  it('loads nothing from Google when analytics is rejected', () => {
    installAnalytics();
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Reject analytics' }));
    expect(gaScript()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Accept analytics' })).toBeNull();
    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? '{}').analytics).toBe(false);
  });

  it('loads GA only after Accept, with ads features off', () => {
    installAnalytics();
    render(<CookieBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
    expect(gaScript()?.getAttribute('src')).toContain('id=G-TEST123');
    const config = (window.dataLayer ?? []).map((args) => Array.from(args as ArrayLike<unknown>)).find((a) => a[0] === 'config');
    expect(config?.[2]).toMatchObject({ allow_google_signals: false, allow_ad_personalization_signals: false, send_page_view: false });
  });

  it('stops and deletes the GA cookies when consent is withdrawn', () => {
    installAnalytics();
    act(() => decide(true));
    document.cookie = '_ga=GA1.1.123; path=/';
    document.cookie = '_ga_TEST123=GS1.1; path=/';
    act(() => decide(false));
    expect(document.cookie).not.toMatch(/_ga/);
    expect(window['ga-disable-G-TEST123']).toBe(true);
  });

  it('reopens from Cookie settings and shows the current choice', () => {
    act(() => decide(false));
    render(<CookieBanner />);
    expect(screen.queryByRole('region', { name: 'Cookies' })).toBeNull();
    act(() => openCookieSettings());
    expect(screen.getByRole('region', { name: 'Cookies' })).toBeTruthy();
    expect(screen.getByText(/analytics rejected/i)).toBeTruthy();
  });

  it('asks again once a choice is a year old', () => {
    const old = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ analytics: true, decidedAt: old, version: 1 }));
    resetConsentForTests();
    installAnalytics();
    render(<CookieBanner />);
    expect(screen.getByRole('button', { name: 'Accept analytics' })).toBeTruthy();
    expect(gaScript()).toBeNull();
  });
});

describe('what GA is told', () => {
  it('strips patient ids and share-link state from the page path', () => {
    expect(pagePath('#shockStates?case=amina-sepsis')).toBe('/shockStates');
    expect(pagePath('#respiratory?s=abc')).toBe('/respiratory');
    expect(pagePath('')).toBe('/');
  });

  it('clears only GA cookies', () => {
    document.cookie = 'other=1; path=/';
    document.cookie = '_ga=1; path=/';
    clearGaCookies();
    expect(document.cookie).toContain('other=1');
    expect(document.cookie).not.toContain('_ga');
  });
});
