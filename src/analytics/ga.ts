import { gaMeasurementId } from '@/lib/env';
import { hasAnalyticsConsent, subscribeConsent } from './consent';

/**
 * Google Analytics 4, loaded only with consent.
 *
 * Not an npm dependency and never in the bundle (CLAUDE.md: no runtime dependency for anything
 * the learner sees): the gtag script is injected from Google the moment — and only the moment —
 * a visitor accepts analytics. Before that no request goes to Google at all, which is stricter
 * than Consent Mode's "denied" pings and is what the cookie policy promises.
 *
 * What it sends, deliberately little:
 *  - a `page_view` per hash route, with the query string STRIPPED — `?case=amina` and `?s=…`
 *    share links would otherwise put patient ids and slider states into GA;
 *  - no user id, no email, no Google signals, no ad personalisation.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

let loaded = false;
let active = false;

/** The route alone: `#shockStates?case=amina` → `/shockStates`. */
export function pagePath(hash: string): string {
  const route = hash.replace(/^#/, '').split('?')[0] ?? '';
  return `/${route}`;
}

function sendPageView() {
  if (!active || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: pagePath(window.location.hash),
    page_location: `${window.location.origin}${pagePath(window.location.hash)}`,
    page_title: document.title,
  });
}

function start(id: string) {
  window[`ga-disable-${id}`] = false;
  active = true;
  if (!loaded) {
    loaded = true;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag() {
      // gtag.js reads the `arguments` object itself, not an array — this is Google's snippet.
      (window.dataLayer ??= []).push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    script.dataset.analytics = 'ga4';
    document.head.appendChild(script);
    window.addEventListener('hashchange', () => {
      // After the router has set the new page's title.
      setTimeout(sendPageView, 0);
    });
  }
  sendPageView();
}

/** Delete every `_ga` cookie on this host and its parent domains. */
export function clearGaCookies() {
  const names = document.cookie
    .split(';')
    .map((c) => c.trim().split('=')[0] ?? '')
    .filter((name) => name === '_ga' || name.startsWith('_ga_'));
  const host = window.location.hostname;
  const parts = host.split('.');
  const domains = ['', ...parts.map((_, i) => parts.slice(i).join('.')).filter((d) => d.includes('.'))];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
    }
  }
}

function stop(id: string) {
  active = false;
  // GA's own kill switch: once set, a loaded gtag.js sends nothing further.
  window[`ga-disable-${id}`] = true;
  clearGaCookies();
}

function sync() {
  const id = gaMeasurementId;
  if (!id) return;
  if (hasAnalyticsConsent()) start(id);
  else if (active || loaded) stop(id);
}

let unsubscribe: (() => void) | null = null;

/** Call once at startup. Follows the consent store from then on. */
export function installAnalytics() {
  if (unsubscribe) return;
  sync();
  unsubscribe = subscribeConsent(sync);
}

/** Test seam. */
export function resetAnalyticsForTests() {
  unsubscribe?.();
  unsubscribe = null;
  loaded = false;
  active = false;
}
