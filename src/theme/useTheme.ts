import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** The ground colours from index.css, so the browser chrome tracks the page.
 *
 * Literals rather than a read of the cascade: this runs to set a `<meta>` the browser has
 * already consumed by the time a computed style would be available. They are stated twice more
 * in index.html's pre-paint script, which cannot import anything — and all three drifted from
 * --bg at some point, which is why themeColor.test.ts now binds them to the generated tokens. */
const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#f6f8fb', dark: '#050a13' };

/**
 * The default when nothing is stored.
 *
 * Dark, deliberately: this is an instrument console and most of the studying it is built for
 * happens at night. A learner who wants their machine's setting can say so — see below for why
 * that is a stored value now rather than an empty slot.
 */
const DEFAULT_PREFERENCE: ThemePreference = 'dark';

function readStored(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' || stored === 'system'
      ? stored
      : DEFAULT_PREFERENCE;
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

function systemTheme(): ResolvedTheme {
  return typeof matchMedia === 'function' && matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function apply(resolved: ResolvedTheme) {
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[resolved]);
}

/**
 * Theme preference, persisted.
 *
 * The inline script in index.html has already stamped `data-theme` before React mounted — this
 * hook owns changes to it, not the initial value.
 *
 * 'system' is a real third state, and since the default became dark it is a real STORED state
 * too. It used to be the absence of a key, which worked only while absence also meant "follow
 * the machine". With dark as the default those two readings collide: an absent key now means
 * dark, so removing the key on "Auto" would hand the learner dark and quietly take away the
 * only route back to their machine. So `choose('system')` writes it, and both this hook and the
 * pre-paint script in index.html have to recognise the value.
 */
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readStored);
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    preference === 'system' ? systemTheme() : preference,
  );

  useEffect(() => {
    const next = preference === 'system' ? systemTheme() : preference;
    setResolved(next);
    apply(next);
  }, [preference]);

  // Only while following the machine: an explicit choice must not be overridden at dusk.
  useEffect(() => {
    if (preference !== 'system' || typeof matchMedia !== 'function') return;
    const query = matchMedia(DARK_QUERY);
    const onChange = () => {
      const next = query.matches ? 'dark' : 'light';
      setResolved(next);
      apply(next);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  const choose = useCallback((next: ThemePreference) => {
    setPreference(next);
    try {
      // All three states are written, 'system' included — see the docblock above.
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Private mode. The choice still applies for this session. */
    }
  }, []);

  return { preference, resolved, choose };
}
