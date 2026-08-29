import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Matches the ground colours in index.css, so the browser chrome tracks the page. */
const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#f2f5f8', dark: '#10161d' };

function readStored(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : 'system';
  } catch {
    return 'system';
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
 * hook owns changes to it, not the initial value. 'system' is a real third state rather than
 * an absent preference: a learner who has not chosen should follow their machine, including
 * when their machine changes at dusk.
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
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Private mode. The choice still applies for this session. */
    }
  }, []);

  return { preference, resolved, choose };
}
