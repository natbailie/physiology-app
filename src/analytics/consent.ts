import { useSyncExternalStore } from 'react';
import { CONSENT_MAX_AGE_DAYS, CONSENT_STORAGE_KEY } from '@/shared/legal/cookies';

/**
 * The visitor's cookie choice.
 *
 * Opt-IN: nothing optional runs until `analytics` is true, and "no decision" is treated exactly
 * like "rejected" by everything except the banner. That is PECR reg. 6 as the ICO reads it —
 * consent must be a positive action, and rejecting must be as easy as accepting.
 *
 * Stored in localStorage (itself strictly necessary: it is what stops the banner reappearing,
 * and it is listed in the cookie policy). Reads are wrapped because private mode can throw.
 */
export interface Consent {
  analytics: boolean;
  decidedAt: string;
  version: 1;
}

const MAX_AGE_MS = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function readStored(now: number = Date.now()): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    if (parsed.version !== 1 || typeof parsed.analytics !== 'boolean' || typeof parsed.decidedAt !== 'string') return null;
    // A year-old choice lapses and the banner asks again.
    if (now - Date.parse(parsed.decidedAt) > MAX_AGE_MS) return null;
    return parsed as Consent;
  } catch {
    return null;
  }
}

interface State {
  consent: Consent | null;
  /** The visitor asked to revisit their choice via "Cookie settings". */
  reopened: boolean;
}

let state: State = { consent: readStored(), reopened: false };
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  for (const listener of listeners) listener();
}

export function getConsent(): Consent | null {
  return state.consent;
}

export function hasAnalyticsConsent(): boolean {
  return state.consent?.analytics === true;
}

export function decide(analytics: boolean) {
  const consent: Consent = { analytics, decidedAt: new Date().toISOString(), version: 1 };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
  } catch {
    /* Private mode: the choice holds for this page load, and the banner asks again next time. */
  }
  set({ consent, reopened: false });
}

export function openCookieSettings() {
  set({ ...state, reopened: true });
}

export function closeCookieSettings() {
  set({ ...state, reopened: false });
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test seam: re-read storage as if the page had just loaded. */
export function resetConsentForTests() {
  set({ consent: readStored(), reopened: false });
}

const snapshot = () => state;

export function useConsent() {
  const current = useSyncExternalStore(subscribeConsent, snapshot, snapshot);
  return {
    consent: current.consent,
    bannerOpen: current.consent === null || current.reopened,
    reopened: current.reopened,
  };
}
